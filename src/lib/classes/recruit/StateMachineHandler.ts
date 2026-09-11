import { createActor } from "xstate";
import { recruitMachine } from "./StateMachine";
import type { RecruitEvent, RecruitErrorEventType } from "./StateMachine";
import { TextChannel } from "discord.js";
import log from "loglevel";

// Re-export RecruitEvent for consumers
export type { RecruitEvent };

/**
 * XState 스테이트 머신 관리 클래스
 */
export class StateMachineHandler {
  private actors: Map<
    string,
    ReturnType<typeof createActor<typeof recruitMachine>>
  >;
  private channelNames: Map<string, string>;

  constructor() {
    this.actors = new Map();
    this.channelNames = new Map();
  }

  /**
   * 새로운 리크루팅 세션 시작
   */
  startSession(
    channelId: string,
    channelName: string,
    channel: TextChannel,
    onStateChange?: (channelId: string, state: string, context: any) => void,
  ) {
    // 채널 이름 저장
    this.channelNames.set(channelId, channelName);

    const actor = createActor(recruitMachine, {
      input: {
        mainCharacterId: null,
        mainCharacterName: null,
        recruitRoute: null,
        recruitType: null,
        termsAgreed: 0,
        skipStateChangeMessage: false,
      },
    });

    // 상태 변경 구독
    actor.subscribe((snapshot) => {
      const name = this.channelNames.get(channelId) || channelId;
      log.info(
        `RecruitManager: Recruit channel [${name}] State: ${snapshot.value}`,
      );
      log.debug(
        `RecruitManager: Recruit channel [${name}] Context:`,
        snapshot.context,
      );

      // 상태 변경 콜백 호출
      if (onStateChange) {
        onStateChange(channelId, snapshot.value as string, snapshot.context);
      }
    });

    actor.start();
    this.actors.set(channelId, actor);

    return actor;
  }

  /**
   * 기존 세션 가져오기
   */
  getSession(channelId: string) {
    return this.actors.get(channelId);
  }

  /**
   * 세션 종료
   */
  endSession(channelId: string) {
    const actor = this.actors.get(channelId);
    if (actor) {
      actor.stop();
      this.actors.delete(channelId);
      this.channelNames.delete(channelId);
    }
  }

  /**
   * 이벤트 전송
   */
  sendEvent(channelId: string, event: RecruitEvent) {
    const actor = this.actors.get(channelId);
    if (!actor) {
      throw new Error(`No active recruit session for channel ${channelId}`);
    }

    actor.send(event);
  }

  /**
   * 현재 상태 확인
   */
  getCurrentState(channelId: string) {
    const actor = this.actors.get(channelId);
    if (!actor) {
      return null;
    }

    return actor.getSnapshot();
  }

  /**
   * 모든 활성 세션 정보
   */
  getActiveSessions() {
    const sessions: Record<string, any> = {};

    this.actors.forEach((actor, channelId) => {
      const snapshot = actor.getSnapshot();
      // completed 상태는 백업하지 않음
      if (snapshot.value !== "completed") {
        sessions[channelId] = snapshot;
      }
    });

    return sessions;
  }

  /**
   * 백업된 snapshot으로 세션 복원
   */
  restoreSessionFromSnapshot(
    channelId: string,
    channelName: string,
    channel: TextChannel,
    snapshotData: any,
    onStateChange?: (channelId: string, state: string, context: any) => void,
  ) {
    // 채널 이름 저장
    this.channelNames.set(channelId, channelName);

    // snapshot으로 actor 생성
    const actor = createActor(recruitMachine, {
      snapshot: snapshotData as any,
    });

    // actor 시작
    actor.start();
    this.actors.set(channelId, actor);

    // 시작 후 상태 변경 구독 (복원 시 초기 상태는 무시됨)
    actor.subscribe((snapshot) => {
      const name = this.channelNames.get(channelId) || channelId;
      log.info(
        `RecruitManager: Recruit channel [${name}] State: ${snapshot.value}`,
      );
      log.debug(
        `RecruitManager: Recruit channel [${name}] Context:`,
        snapshot.context,
      );

      // 상태 변경 콜백 호출
      if (onStateChange) {
        onStateChange(channelId, snapshot.value as string, snapshot.context);
      }
    });

    return actor;
  }
}
