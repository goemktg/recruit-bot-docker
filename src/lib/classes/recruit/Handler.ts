import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CategoryChannel,
  ChannelType,
  PermissionsBitField,
  Client,
  TextChannel,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
} from "discord.js";
import log from "loglevel";
import { StateMachineHandler } from "./StateMachineHandler";
import { DiscordHandler } from "../DiscordHandler";
import { EsiRequester } from "../EsiHandler";
import { StateMachine } from "xstate";
import { RecruitErrorEventType } from "./StateMachine";
import { RecruitActions } from "./Actions";

/**
 * 리크루팅 인터랙션 핸들러 클래스
 */
export class RecruitHandler {
  private stateMachine: StateMachineHandler;
  private client: Client | null = null;

  constructor(client?: Client) {
    this.stateMachine = new StateMachineHandler();
    if (client) {
      this.client = client;
    }
  }

  /**
   * 상태 변경 처리
   */
  private async handleStateChange(
    channelId: string,
    state: string,
    context: any,
  ) {
    const actor = this.stateMachine.getSession(channelId);
    if (!actor || !this.client) return;

    const channel = await DiscordHandler.getChannelById(this.client, channelId);
    if (!channel) return;

    log.debug(
      `Handling specific state change: ${state} for channel ${channelId}`,
    );

    // 에러 후 복귀 시 메시지 전송 스킵
    if (context.skipStateChangeMessage) {
      log.info(`Skipping state change message for ${state} (error recovery)`);
      const rawActor: any = actor;
      rawActor.send({ type: "clearSkipStateChangeMessage" });
      return;
    }

    try {
      // showingRecruitTypeForm 상태일 때 리크룻 타입 선택 폼 전송
      if (state === "showingRecruitTypeForm") {
        await RecruitActions.showRecruitTypeForm(channel as TextChannel);
      }
      // checkingConditions 상태일 때 NIS 조건 확인
      else if (state === "checkingConditions") {
        await RecruitActions.showConfirmConditions(channel as TextChannel);
      }
      // showingSelectRecruitRouteForm 상태일 때 리크룻 루트 선택 폼 전송
      else if (state === "showingSelectRecruitRouteForm") {
        await RecruitActions.showRecruitRouteSelectForm(channel as TextChannel);
      }
      // showTerm 상태일 때 termsAgreed 횟수에 맞는 약관 동의 메시지 전송
      else if (state === "showTerm") {
        const termsAgreed = context.termsAgreed as number;
        await RecruitActions.showTerm(channel as TextChannel, termsAgreed);
      }
      // showSeatRegistrationForm 상태일 때 SEAT 확인 폼 전송
      else if (state === "showSeatRegistrationForm") {
        await RecruitActions.showSeatRegistrationForm(channel as TextChannel);
      }
      // callRecruiter 상태일 때 리크루터 호출 폼 전송
      else if (state === "callRecruiter") {
        await RecruitActions.callRecruiter(
          channel as TextChannel,
          channelId,
          context,
          this.stateMachine,
        );
      }
    } catch (error) {
      log.error("Error handling specific state change:" + state, error);

      try {
        // actor does not expose .interaction on the typed Actor; extract interaction from its snapshot/state
        const rawActor: any = actor;
        const actorSnapshot =
          typeof rawActor.getSnapshot === "function"
            ? rawActor.getSnapshot()
            : rawActor.state;
        const actorInteraction = actorSnapshot?.context?.interaction as
          | ButtonInteraction
          | ModalSubmitInteraction
          | StringSelectMenuInteraction
          | null;

        await RecruitActions.sendErrorMessage(
          actorInteraction,
          channel as TextChannel,
        );

        // 이전 상태로 복귀 (skipStateChangeMessage 플래그로 중복 메시지 방지)
        actor.send({ type: `${state}_ERROR` as RecruitErrorEventType });
      } catch (sendError) {
        log.error("Error while processing error...", sendError);
      }
    }
  }

  /**
   * 현재 세션 상태 확인 (헬퍼 메서드)
   */
  private async getCurrentSession(
    interaction:
      ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
    channelId: string,
  ) {
    const currentState = this.stateMachine.getCurrentState(channelId);
    if (!currentState) {
      await interaction.reply({
        content: "활성화된 리크루팅 세션이 없습니다.",
        ephemeral: true,
      });
      return null;
    }
    return currentState;
  }

  /**
   * 통합 리크루팅 인터랙션 처리
   */
  async handleRecruitInteraction(
    interaction:
      ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
  ) {
    try {
      const channelId = interaction.channelId;
      if (!channelId) throw new Error("Channel ID is undefined");

      const customId = interaction.customId;

      // customId에서 action 추출: RECRUIT_[ACTION]
      if (!customId.startsWith("RECRUIT_")) {
        throw new Error(`Invalid recruit customId: ${customId}`);
      }

      const action = customId.substring("RECRUIT_".length);

      // Action 기반 처리
      switch (action) {
        case "START_SESSION":
          await RecruitActions.createRecruitChannel(
            interaction as ButtonInteraction,
            this.stateMachine,
            this.handleStateChange.bind(this),
          );
          break;

        case "START_DAEHWA":
          await RecruitActions.createDaehwaChannel(
            interaction as ButtonInteraction,
          );
          break;

        case "SUBMIT_RECRUIT_TYPE_SELECT_FORM": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;
          await RecruitActions.submitRecruitTypeForm(
            interaction as StringSelectMenuInteraction,
            channelId,
            currentState,
            this.stateMachine,
          );
          break;
        }

        case "SHOW_ENTER_MAIN_CHAR_MODAL": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;
          await RecruitActions.showEnterMainCharModal(
            interaction as ButtonInteraction,
            currentState,
          );
          break;
        }

        case "SUBMIT_MAIN_CHAR_MODAL": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;
          await RecruitActions.submitMainCharModal(
            interaction as ModalSubmitInteraction,
            channelId,
            currentState,
            this.stateMachine,
          );
          break;
        }

        case "SUBMIT_RECRUIT_ROUTE_SELECT_FORM": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;
          await RecruitActions.submitRecruitRouteSelectForm(
            interaction as StringSelectMenuInteraction,
            channelId,
            currentState,
            this.stateMachine,
          );
          break;
        }

        case "AGREE_TERM": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;

          await RecruitActions.agreeTerm(
            interaction as ButtonInteraction,
            channelId,
            currentState,
            this.stateMachine,
          );
          break;
        }

        case "CONFIRM_SEAT_REGISTRATION": {
          const currentState = await this.getCurrentSession(
            interaction,
            channelId,
          );
          if (!currentState) break;

          await RecruitActions.confirmSeatRegistration(
            interaction as ButtonInteraction,
            channelId,
            currentState,
            this.stateMachine,
          );
          break;
        }

        default:
          throw new Error(`Unknown recruit action: ${action}`);
      }
    } catch (error) {
      log.error("RecruitManager: Error handling recruit interaction:", error);
      RecruitActions.sendErrorMessage(
        interaction,
        interaction.channel as TextChannel,
      );
    }
  }

  /**
   * 조건숙지함 메시지 처리
   */
  async handleAgreeConditionsMessage(channel: TextChannel) {
    const currentState = this.stateMachine.getCurrentState(channel.id);
    if (!currentState) {
      log.warn(
        `No active recruit session for channel ${channel.id} when handling agree conditions message.`,
      );
      return;
    }

    RecruitActions.confirmConditions(channel, currentState, this.stateMachine);
  }

  /**
   * 백업된 세션 복원
   */
  async restoreSession(
    channelId: string,
    channelName: string,
    channel: TextChannel,
    sessionData: any,
  ) {
    log.info(
      `RecruitHandler: Restoring session for channel ${channelName} (${channelId})`,
    );

    try {
      // snapshot을 사용하여 세션 복원
      this.stateMachine.restoreSessionFromSnapshot(
        channelId,
        channelName,
        channel,
        sessionData,
        this.handleStateChange.bind(this),
      );

      log.info(
        `RecruitHandler: Session restored successfully for ${channelName} at state: ${sessionData.value}`,
      );
    } catch (error) {
      log.error(
        `RecruitHandler: Error restoring session for channel ${channelId}:`,
        error,
      );
    }
  }

  /**
   * StateMachineHandler 인스턴스 가져오기 (백업용)
   */
  getStateMachineHandler(): StateMachineHandler {
    return this.stateMachine;
  }
}
