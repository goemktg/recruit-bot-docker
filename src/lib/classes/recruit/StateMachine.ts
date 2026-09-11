import { setup, assign, fromPromise } from "xstate";
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";

// made with: https://stately.ai/

// Context 타입 정의
export interface RecruitContext {
  mainCharacterId: string | null;
  mainCharacterName: string | null;
  recruitRoute: string | null;
  recruitType: "NIDU" | "NIS" | null;
  termsAgreed: number; // NIS 동의 확인 횟수 (0~3)
  skipStateChangeMessage: boolean; // 상태 변경 메시지 건너뛰기 (에러 후 복귀)
}

// Events 타입 정의
export type RecruitEvent =
  | { type: "START_RECRUIT"; interaction: ButtonInteraction }
  | {
      type: "SELECTED_RECRUIT_TYPE";
      interaction: StringSelectMenuInteraction;
      recruitType: "NIDU" | "NIS";
    }
  | { type: "showingRecruitTypeForm_ERROR" } // 리크룻 타입 선택 실패
  | {
      type: "SUBMIT_MAIN_CHAR";
      interaction: ModalSubmitInteraction;
      characterName: string;
      characterId: string;
    }
  | { type: "showingEnterMainCharForm_ERROR" } // 메인 캐릭터 입력 실패
  | { type: "CONFIRM_CONDITIONS"; interaction: ButtonInteraction | null } // NIS 조건 숙지 (메시지 or 버튼)
  | { type: "checkingConditions_ERROR" } // 조건 확인 실패
  | {
      type: "SELECT_RECRUIT_ROUTE";
      interaction: StringSelectMenuInteraction;
      route: string;
    }
  | { type: "showingSelectRecruitRouteForm_ERROR" } // 루트 선택 실패
  | { type: "AGREE_TERM"; interaction: ButtonInteraction } // NIS 동의 (2번)
  | { type: "showTerm_ERROR" } // 동의 실패
  | { type: "CONFIRM_SEAT_REGISTRATION"; interaction: ButtonInteraction } // SEAT 확인
  | { type: "showSeatRegistrationForm_ERROR" } // SEAT 확인 실패
  | { type: "SUCCESS_CALL_RECRUITER"; interaction: ButtonInteraction | null } // 리크루터 호출 성공
  | { type: "callRecruiter_ERROR" } // 리크루터 호출 실패
  | { type: "CANCEL" };

// 에러 이벤트 타입만 추출
export type RecruitErrorEventType = Extract<
  RecruitEvent,
  { type: `${string}_ERROR` }
>["type"];

// 서비스 함수들 (실제 구현에서 사용)
export const showRecruitTypeFormService = async (
  context: RecruitContext,
  event: any,
) => {
  // 리크룹 종류 선택 폼 보내기
  return { success: true };
};

export const validateMainCharService = async (
  context: RecruitContext,
  event: any,
) => {
  // ESI API를 통한 캐릭터 검증 로직
  return {
    success: true,
    characterId: "12345",
    characterName: event.characterName,
  };
};

export const confirmSeatRegistrationService = async (
  context: RecruitContext,
  event: any,
) => {
  // SEAT 등록 확인 로직
  return { success: true };
};

export const callRecruiterService = async (
  context: RecruitContext,
  event: any,
) => {
  // 리크루터 호출 로직
  return { success: true };
};

// 스테이트 머신 설정 (Visualizer 호환)
export const recruitMachine = setup({
  types: {
    context: {} as RecruitContext,
    events: {} as RecruitEvent,
  },
  actors: {},
  guards: {
    // 리크룻 타입이 NIDU인지 확인
    isNIDU: ({ context }) => {
      return context.recruitType === "NIDU";
    },

    // 리크룻 타입이 NIS인지 확인
    isNIS: ({ context }) => {
      return context.recruitType === "NIS";
    },

    // NIS 동의가 1번 완료되었는지 확인 (마지막 약관)
    hasAgreedTwoTimes: ({ context }) => {
      return context.termsAgreed >= 1;
    },

    // NIS 동의가 아직 1번 미만인지 확인 (더 보여줄 약관이 있음)
    needsMoreAgreements: ({ context }) => {
      return context.termsAgreed < 1;
    },
  },
  actions: {
    // Context 업데이트 액션들
    setRecruitType: assign({
      recruitType: ({ event }) => {
        if (event.type === "SELECTED_RECRUIT_TYPE") {
          return event.recruitType;
        }
        return null;
      },
    }),

    setMainCharacter: assign({
      mainCharacterId: ({ event }) => {
        if (event.type === "SUBMIT_MAIN_CHAR") {
          return event.characterId;
        }
        return null;
      },
      mainCharacterName: ({ event }) => {
        if (event.type === "SUBMIT_MAIN_CHAR") {
          return event.characterName;
        }
        return null;
      },
    }),

    setRecruitRoute: assign({
      recruitRoute: ({ event }) => {
        if (event.type === "SELECT_RECRUIT_ROUTE") {
          return event.route;
        }
        return null;
      },
    }),

    incrementTermsAgreed: assign({
      termsAgreed: ({ context }) => context.termsAgreed + 1,
    }),

    setSkipStateChangeMessage: assign({
      skipStateChangeMessage: true,
    }),

    clearSkipStateChangeMessage: assign({
      skipStateChangeMessage: false,
    }),
  },
}).createMachine({
  id: "recruit",
  initial: "idle",
  context: {
    mainCharacterId: null,
    mainCharacterName: null,
    recruitRoute: null,
    recruitType: null,
    termsAgreed: 0,
    skipStateChangeMessage: false,
  },
  states: {
    idle: {
      on: {
        START_RECRUIT: "showingRecruitTypeForm",
      },
    },

    showingRecruitTypeForm: {
      on: {
        SELECTED_RECRUIT_TYPE: {
          target: "showingEnterMainCharForm",
          actions: ["setRecruitType"],
        },
        showingRecruitTypeForm_ERROR: {
          target: "idle",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    showingEnterMainCharForm: {
      on: {
        SUBMIT_MAIN_CHAR: {
          target: "mainCharValidated",
          actions: ["setMainCharacter"],
        },
        showingEnterMainCharForm_ERROR: {
          target: "showingRecruitTypeForm",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    mainCharValidated: {
      always: [
        { target: "showSeatRegistrationForm", guard: "isNIDU" },
        { target: "checkingConditions", guard: "isNIS" },
      ],
    },

    // SEAT 확인 (통합)
    showSeatRegistrationForm: {
      on: {
        CONFIRM_SEAT_REGISTRATION: {
          target: "callRecruiter",
        },
        showSeatRegistrationForm_ERROR: [
          {
            target: "showTerm",
            guard: "isNIS",
            actions: ["setSkipStateChangeMessage"],
          },
          {
            target: "showingEnterMainCharForm",
            guard: "isNIDU",
            actions: ["setSkipStateChangeMessage"],
          },
        ],
      },
    },

    callRecruiter: {
      on: {
        SUCCESS_CALL_RECRUITER: {
          target: "completed",
        },
        callRecruiter_ERROR: {
          target: "showSeatRegistrationForm",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    // NIS 플로우
    checkingConditions: {
      on: {
        CONFIRM_CONDITIONS: {
          target: "showingSelectRecruitRouteForm",
        },
        checkingConditions_ERROR: {
          target: "showingEnterMainCharForm",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    showingSelectRecruitRouteForm: {
      on: {
        SELECT_RECRUIT_ROUTE: {
          target: "showTerm",
          actions: ["setRecruitRoute"],
        },
        showingSelectRecruitRouteForm_ERROR: {
          target: "checkingConditions",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    showTerm: {
      on: {
        AGREE_TERM: [
          {
            target: "showTerm",
            guard: "needsMoreAgreements",
            actions: ["incrementTermsAgreed"],
          },
          {
            target: "showSeatRegistrationForm",
            guard: "hasAgreedTwoTimes",
          },
        ],
        showTerm_ERROR: {
          target: "showingSelectRecruitRouteForm",
          actions: ["setSkipStateChangeMessage"],
        },
      },
    },

    completed: {
      type: "final",
    },
  },
});

export type RecruitMachine = typeof recruitMachine;
