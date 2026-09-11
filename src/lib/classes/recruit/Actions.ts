import {
  ButtonInteraction,
  CategoryChannel,
  ChannelType,
  PermissionsBitField,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
  StringSelectMenuBuilder,
} from "discord.js";
import log from "loglevel";
import { StateMachineHandler } from "./StateMachineHandler";
import { EsiRequester } from "../EsiHandler";
import {
  terms,
  banData,
  banDataStringMap,
  recruiterChannelNames,
  recruiterRoleNames,
} from "../../../static/data";
import { SeatHandler } from "../seat/Handler";
import { DiscordHandler } from "../DiscordHandler";

interface BanCharInfo {
  char: string[];
  corp: string[];
}

export class RecruitActions {
  /**
   * 밴 리스트 확인
   */
  private static checkBanList(
    banCharInfo: BanCharInfo,
    recruiterRoleId?: string,
  ) {
    let isBaned = false;
    let banReasonString = "";

    for (const [banReason, banList] of Object.entries(banData)) {
      for (const [banType, names] of Object.entries(banList)) {
        for (const name of names) {
          if (banCharInfo[banType as "char" | "corp"]?.includes(name)) {
            isBaned = true;
            banReasonString += `${banDataStringMap[banType as "char" | "corp"]} ${name}은(는) ${banDataStringMap[banReason as "evegall" | "evegall_boycott" | "nisuwaz"]} 대상입니다.\n`;
          }
        }
      }
    }

    const mentionPart = recruiterRoleId ? `<@&${recruiterRoleId}>\n` : "";
    const reason =
      `${mentionPart} 주의! 현재 리크룻 절차를 진행중인 캐릭터 **${banCharInfo.char[0]}**은(는) 밴 리스트에 등재되어 있습니다. 반드시 참고하시고 리크룻 바랍니다.\`\`\`해당 캐릭터가 포함된 밴 리스트는 다음과 같습니다:\n\n` +
      banReasonString +
      "```";
    return { isBaned, reason };
  }

  static async sendErrorMessage(
    interaction:
      | ButtonInteraction
      | ModalSubmitInteraction
      | StringSelectMenuInteraction
      | null,
    channel: TextChannel,
  ) {
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const message = `⚠️ **오류: t:${now}**\n처리 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해보시거나 t: 다음에 오는 값을 포함해서 <@697699550999085116> 에게 문의해 주세요.`;

    try {
      if (!interaction) {
        throw new Error("Interaction is null");
      }

      if (interaction.replied || interaction.deferred) {
        // 이미 응답했거나 defer된 경우 followUp 사용
        await interaction.followUp({
          content: message,
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      } else {
        // 아직 응답하지 않은 경우 reply 사용
        await interaction.reply({
          content: message,
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      }
    } catch (error) {
      // 인터랙션 응답 실패 시 채널에 직접 전송
      log.error(
        "Failed to reply to interaction, sending to channel instead:",
        error,
      );
      channel.send({
        content: message,
        allowedMentions: { parse: [] },
      });
    }
  }

  /**
   * 잘못된 상태 응답 (헬퍼 메서드)
   */
  private static async replyInvalidState(
    interaction:
      ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
  ) {
    await interaction.reply({
      content:
        "이미 진행된 단계입니다. 다시 선택할 수 없습니다. 혹시 잘못 선택하셨다면 리크루터에게 문의해 주세요.",
      ephemeral: true,
    });
  }

  /**
   * 리크룻 채널 생성
   */
  static async createRecruitChannel(
    interaction: ButtonInteraction,
    stateMachine: StateMachineHandler,
    handleStateChange: (
      channelId: string,
      state: string,
      context: any,
    ) => Promise<void>,
  ) {
    if (!interaction.guild) return;

    try {
      // 상담중 카테고리 찾기
      const consultingCategory = interaction.guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === "상담중",
      ) as CategoryChannel | undefined;

      if (!consultingCategory) {
        await interaction.reply({
          content: "상담중 카테고리를 찾을 수 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 이미 상담 중인지 확인 (상담중 카테고리 내의 채널만)
      const existingChannel = consultingCategory.children.cache.find(
        (ch) =>
          ch.name.startsWith(interaction.user.tag) &&
          ch.type === ChannelType.GuildText,
      );

      if (existingChannel) {
        await interaction.reply({
          content: `이미 진행 중인 상담이 있습니다: ${existingChannel}`,
          ephemeral: true,
        });
        return;
      }

      // 리크루터 롤 찾기
      const recruiterRole = interaction.guild.roles.cache.find(
        (role) => role.name === recruiterRoleNames.NIS,
      );

      if (!recruiterRole) {
        await interaction.reply({
          content: "리크루터 롤을 찾을 수 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 채널 생성
      const channel = await consultingCategory.children.create({
        name: `${interaction.user.tag}-recruit`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id: recruiterRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
        ],
      });

      await interaction.reply({
        content: `리크룻 채널이 생성되었습니다: ${channel}`,
        ephemeral: true,
      });

      // 채널에 초기 메시지 전송
      await channel.send({
        content: `**${interaction.user.username}** 님, Nisuwa Cartel 통합 리크룻 서버에 오신 걸 환영합니다. \n아래의 간단한 꼽 설명을 읽고, 가입을 원하시는 꼽을 선택하여 다음 절차를 진행해 주세요. \n궁금한 점이 있다면 언제든지 \`@리크루터\` 맨션으로 리크루터를 호출하셔도 괜찮습니다. \n* NISUWAZ: 주력 PVP 콥으로 로우섹 소~중규모 PVP 활동을 주로 합니다. \n* Nisuwa Dairy Union: 뉴비 친화적 웜홀 콥으로 다양한 PVE 컨텐츠를 즐기고 있습니다. PVP 활동에도 자유롭게 참여할 수 있습니다.`,
      });

      // 리크룹 세션 시작 (상태 변경 콜백 등록)
      const actor = stateMachine.startSession(
        channel.id,
        channel.name,
        channel,
        async (channelId: string, state: string, context: any) => {
          await handleStateChange(channelId, state, context);
        },
      );

      actor.send({ type: "START_RECRUIT", interaction });
    } catch (error) {
      log.error("Error creating recruit channel:", error);
      await interaction.reply({
        content: "채널 생성 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  }

  /**
   * 상담 채널 생성
   */
  static async createDaehwaChannel(interaction: ButtonInteraction) {
    if (!interaction.guild) return;

    try {
      // 상담중 카테고리 찾기
      const consultingCategory = interaction.guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === "상담중",
      ) as CategoryChannel | undefined;

      if (!consultingCategory) {
        await interaction.reply({
          content: "상담중 카테고리를 찾을 수 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 이미 상담 중인지 확인 (상담중 카테고리 내의 채널만)
      const existingChannel = consultingCategory.children.cache.find(
        (ch) =>
          ch.name.startsWith(interaction.user.tag) &&
          ch.type === ChannelType.GuildText,
      );

      if (existingChannel) {
        await interaction.reply({
          content: `이미 진행 중인 상담이 있습니다: ${existingChannel}`,
          ephemeral: true,
        });
        return;
      }

      // 리크루터 롤 찾기
      const recruiterRole = interaction.guild.roles.cache.find(
        (role) => role.name === recruiterRoleNames.NIS,
      );

      if (!recruiterRole) {
        await interaction.reply({
          content: "리크루터 롤을 찾을 수 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 채널 생성
      const channel = await consultingCategory.children.create({
        name: `${interaction.user.tag}-daehwa`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
          {
            id: recruiterRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
        ],
      });

      await interaction.reply({
        content: `상담 채널이 생성되었습니다: ${channel}`,
        ephemeral: true,
      });

      // 채널에 초기 메시지 전송
      await channel.send({
        content: `${interaction.user} 님의 상담을 시작합니다.\n\n${recruiterRole} 담당자가 곧 응대하겠습니다.`,
      });
    } catch (error) {
      log.error("Error creating daehwa channel:", error);
      await interaction.reply({
        content: "채널 생성 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  }

  /**
   * 리크루팅 타입 선택 폼 전송
   */
  static async showRecruitTypeForm(channel: TextChannel) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("RECRUIT_SUBMIT_RECRUIT_TYPE_SELECT_FORM")
      .setPlaceholder("여기를 눌러 원하시는 꼽을 선택하세요")
      .addOptions([
        {
          label: "NIDU (Nisuwa Dairy Union)",
          description: "뉴비 친화적 웜홀 콥",
          value: "NIDU",
        },
        {
          label: "NIS (NISUWAZ)",
          description: "주력 PVP 콥",
          value: "NIS",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu,
    );

    await channel.send({
      content: "가입을 원하시는 꼽을 선택해주세요:",
      components: [row],
    });
  }

  /**
   * 리크루팅 타입 선택 처리
   */
  static async submitRecruitTypeForm(
    interaction: StringSelectMenuInteraction,
    channelId: string,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("showingRecruitTypeForm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    const recruitType = interaction.values[0] as "NIDU" | "NIS";

    stateMachine.sendEvent(channelId, {
      type: "SELECTED_RECRUIT_TYPE",
      interaction,
      recruitType,
    });

    const button = new ButtonBuilder()
      .setCustomId("RECRUIT_SHOW_ENTER_MAIN_CHAR_MODAL")
      .setLabel("메인 캐릭터 입력")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: `**${recruitType}** 리크루팅을 진행합니다. 아래 버튼을 눌러 메인 캐릭터를 입력해주세요.`,
      components: [row],
    });
  }

  /**
   * 메인 캐릭터 입력 버튼 처리
   */
  static async showEnterMainCharModal(
    interaction: ButtonInteraction,
    currentState: any,
  ) {
    if (!currentState.matches("showingEnterMainCharForm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("RECRUIT_SUBMIT_MAIN_CHAR_MODAL")
      .setTitle("메인 캐릭터 입력");

    const characterInput = new TextInputBuilder()
      .setCustomId("character-name")
      .setLabel("메인 캐릭터 이름")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("캐릭터 이름을 입력하세요")
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      characterInput,
    );
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }

  /**
   * 메인 캐릭터 모달 제출 처리
   */
  static async submitMainCharModal(
    interaction: ModalSubmitInteraction,
    channelId: string,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("showingEnterMainCharForm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    const characterName =
      interaction.fields.getTextInputValue("character-name");
    const recruitType = currentState.context.recruitType as "NIDU" | "NIS";

    await interaction.reply({
      content: `메인 캐릭터 **${characterName}**의 정보를 가져오는 중입니다...`,
    });

    try {
      const mainCharacterIds = await EsiRequester.getIdsFromNames([
        characterName,
      ]);

      if (
        !mainCharacterIds.characters ||
        mainCharacterIds.characters.length === 0
      ) {
        await interaction.editReply({
          content: `⚠️ 캐릭터 **${characterName}**을(를) 찾을 수 없습니다. 이름을 확인하고 다시 시도해주세요.`,
        });
        return;
      }

      const mainCharacterId = mainCharacterIds.characters[0].id.toString();
      const mainCharacterCorpHistory =
        await EsiRequester.getCorpHistoryFromCharId(mainCharacterId);

      const corpNames = await EsiRequester.getNamesFromIds([
        ...new Set(
          mainCharacterCorpHistory.map((entry) => entry.corporation_id),
        ),
      ]);

      const corpIdToNameMap = new Map(
        corpNames.map((corp) => [corp.id, corp.name]),
      );

      const corpHistory = mainCharacterCorpHistory
        .map((obj, index) => {
          const startDate = obj.start_date.split("T")[0];
          const corporationName = corpIdToNameMap.get(obj.corporation_id);
          const previousEndDate =
            index > 0
              ? mainCharacterCorpHistory[index - 1].start_date.split("T")[0]
              : null;
          return `${startDate}~${previousEndDate ?? ""} ${corporationName}`;
        })
        .join("\n");

      // 밴 리스트 확인
      const allCorpNames = Array.from(corpIdToNameMap.values());
      const banCharInfo: BanCharInfo = {
        char: [characterName],
        corp: allCorpNames,
      };

      // 리크루터 롤 찾기
      const recruiterRoleName = recruiterRoleNames[recruitType];
      const recruiterRole = interaction.guild?.roles.cache.find(
        (role) => role.name === recruiterRoleName,
      );

      const banCheck = RecruitActions.checkBanList(
        banCharInfo,
        recruiterRole?.id,
      );

      const charInfoEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${characterName}:${mainCharacterId}`)
        .setThumbnail(
          `https://images.evetech.net/characters/${mainCharacterId}/portrait?size=128`,
        )
        .setDescription("```" + corpHistory + "```");

      await interaction.editReply({
        content: `메인 캐릭터 **${characterName}**의 정보를 성공적으로 가져왔습니다.`,
        embeds: [charInfoEmbed],
      });

      // 밴 대상인 경우 리크루터 채널에 알림
      if (banCheck.isBaned && interaction.guild) {
        const recruiterChannelName = recruiterChannelNames[recruitType];
        const recruiterChannel = interaction.guild.channels.cache.find(
          (c) =>
            c.type === 0 && (c as TextChannel).name === recruiterChannelName,
        ) as TextChannel | undefined;

        if (recruiterChannel) {
          await recruiterChannel.send({
            content: banCheck.reason,
            allowedMentions: { roles: [recruiterRole?.id || ""] },
          });
        }
      }

      stateMachine.sendEvent(channelId, {
        type: "SUBMIT_MAIN_CHAR",
        interaction,
        characterName,
        characterId: mainCharacterId,
      });
    } catch (error) {
      log.error("Error validating character:", error);

      throw error;
    }
  }

  /**
   * 조건 내용 보내기
   */
  static async showConfirmConditions(channel: TextChannel) {
    await channel.send({
      content:
        "[NISUWAZ 가입 전 안내사항] \n\n저희 Nisuwaz에 오신 걸 환영합니다! 로우 시큐리티 PvP 꼽 활동을 위해 다음 내용을 꼭 숙지해 주시기 바랍니다. \n\n1. 로섹 PvP 활동 특성상 시큐리티 하락은 자연스러운 현상이며, 이로 인해 하이섹 통행이 제한될 수 있습니다. 이를 보완하기 위해 **[지타<->로섹]간 자체 운송 서비스**를 지원해 드리고 있습니다.\n\n2. 떨어진 시큐리티는 다양한 방법으로 다시 올릴 수 있으니 너무 걱정하지 않으셔도 됩니다. 없이 떨어지게 되어있으며 다시 올릴 수 있는 방법이 여러가지가 있으니 크게 문제되는 부분은 아닙니다.\n\n3. 어떤 경우에도 **블루(아군) 공격은 금지**됩니다. 만약 블루에게 공격받는다면, **절대 반격하지 마시고 스크린샷 등 증거를 수집해 리더쉽에게 제보**해 주세요. (반격시 쌍방 과실로 오해받거나, 불이익을 당하실 수 있어, 여러분을 보호하기 위함입니다.) \n\n4. 저희 Nisuwaz는 현재 오메가 계정만 가입을 받고 있습니다. (알파 계정은 바로 오메가가 될 예정일 경우에만 가입이 가능합니다.) 아직 알파 계정이시라면 뉴비 육성 꼽인 '**NIDU**' 가입을 추천해 드립니다.\n\n위 내용을 모두 확인하셨다면 채팅창에 \`/조건숙지함\`이라고 입력하여 다음 절차를 진행해 주세요. 감사합니다!",
    });
  }

  /**
   * 조건 확인 처리
   */
  static async confirmConditions(
    channel: TextChannel,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("checkingConditions")) {
      return;
    }

    stateMachine.sendEvent(channel.id, {
      type: "CONFIRM_CONDITIONS",
      interaction: null,
    });
    await channel.send({
      content: "내용 숙지를 확인했습니다.",
    });
  }

  /**
   * 리크루팅 경로 선택 폼 전송
   */
  static async showRecruitRouteSelectForm(channel: TextChannel) {
    await channel.send({
      content: "가입을 하시게 된 계기를 말해주세요:",
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("RECRUIT_SUBMIT_RECRUIT_ROUTE_SELECT_FORM")
            .setPlaceholder("여기를 눌러 리크룻 글을 접한 경로를 선택하세요")
            .addOptions([
              {
                label: "DC인사이드 이브 온라인 갤러리 리크룻 광고글",
                value: "DC인사이드 이브 온라인 갤러리 리크룻 광고글",
              },
              {
                label: "네이버 카페 리크룻 광고글",
                value: "네이버 카페 리크룻 광고글",
              },
              {
                label: "리크루터 직접 추천",
                value: "리크루터 직접 추천",
              },
            ]),
        ),
      ],
    });
  }

  /**
   * 리크루팅 경로 제출 처리
   */
  static async submitRecruitRouteSelectForm(
    interaction: StringSelectMenuInteraction,
    channelId: string,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("showingSelectRecruitRouteForm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    const route = interaction.values[0];

    await interaction.reply({
      content: `리크룻 경로 **${route}**가(이) 선택되었습니다.`,
    });

    stateMachine.sendEvent(channelId, {
      type: "SELECT_RECRUIT_ROUTE",
      interaction,
      route,
    });
  }

  /**
   * 약관 동의 폼 전송
   */
  static async showTerm(channel: TextChannel, numberOfAgreements: number) {
    const key = numberOfAgreements as keyof typeof terms;
    channel.send({
      content: `다음 내용을 읽고 동의해 주세요:\n\n${terms[key].message} \n\n위 사항에 동의하시면 아래 버튼을 눌러주세요.`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("RECRUIT_AGREE_TERM")
            .setLabel("동의합니다")
            .setEmoji({ name: "✅" })
            .setStyle(ButtonStyle.Success),
        ),
      ],
    });
  }

  /**
   * 약관 동의 처리
   */
  static async agreeTerm(
    interaction: ButtonInteraction,
    channelId: string,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("showTerm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    const currentTermsAgreed = currentState.context.termsAgreed;
    const termType = terms[currentTermsAgreed as keyof typeof terms].type;

    await interaction.reply({
      content: `**${termType}** 동의를 확인했습니다.`,
    });

    if (currentTermsAgreed >= 1)
      await interaction.followUp({
        content: "모든 약관 동의가 완료되었습니다.",
      });

    stateMachine.sendEvent(channelId, { type: "AGREE_TERM", interaction });
  }

  /**
   * SEAT 등록 확인 폼 전송
   */
  static async showSeatRegistrationForm(channel: TextChannel) {
    await channel.send({
      content:
        "마지막으로 안전한 꼽 운영을 위한 필수 보안 절차 (SeAT 등록)가 남았습니다.\n\n아래 **'SeAT'** 버튼을 눌러 웹사이트를 방문하여 이브 온라인 계정으로 로그인한 뒤, **위에서 입력**한 메인 캐릭터를 등록하고 '등록 완료' 버튼을 눌러주세요.\n* 참고: EVE Online API 특성상 정보를 받아오는 데 약 **10~30분 정도 소요**될 수 있습니다 \n * 알트(부캐릭터)가 있으시다면 기다리시는 동안 '가이드' 버튼을 눌러 나오는 가이드를 참고하여 함께 등록해 주시면 감사하겠습니다.",
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("RECRUIT_CONFIRM_SEAT_REGISTRATION")
            .setLabel("등록 완료")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel("SeAT")
            .setStyle(ButtonStyle.Link)
            .setURL("https://seat.nisuwaz.com/"),
          new ButtonBuilder()
            .setLabel("가이드")
            .setStyle(ButtonStyle.Link)
            .setURL("https://forums.nisuwaz.com/t/seat/224"),
        ),
      ],
    });
  }

  /**
   * SEAT 확인 처리
   */
  static async confirmSeatRegistration(
    interaction: ButtonInteraction,
    channelId: string,
    currentState: any,
    stateMachine: StateMachineHandler,
  ) {
    if (!currentState.matches("showSeatRegistrationForm")) {
      await RecruitActions.replyInvalidState(interaction);
      return;
    }

    try {
      await interaction.reply({
        content: "SEAT 등록 확인 중입니다...",
        ephemeral: true,
      });

      await SeatHandler.getCharacterSheetFromId(
        currentState.context.mainCharacterId.toString(),
      );

      await interaction.editReply({
        content: "✅ SeAT 등록이 확인되었습니다!",
      });

      stateMachine.sendEvent(channelId, {
        type: "CONFIRM_SEAT_REGISTRATION",
        interaction,
      });
    } catch (error) {
      log.error("Error confirming SEAT registration");

      await interaction.editReply({
        content:
          "⚠️ SeAT 등록 확인에 실패했습니다. SeAT에 메인 캐릭터가 제대로 등록되었는지 확인해주세요.\n\n이미 등록되었다면 등록에 시간이 걸릴 수 있으므로 잠시 기다려주세요.",
      });
    }
  }

  /**
   * 리크루터 호출 폼 전송
   */
  static async callRecruiter(
    channel: TextChannel,
    channelId: string,
    context: any,
    stateMachine: StateMachineHandler,
  ) {
    const recruitType = context.recruitType as "NIDU" | "NIS";
    const mainCharacterName = context.mainCharacterName as string;
    const mainCharacterId = context.mainCharacterId as string;
    const recruitRoute = context.recruitRoute as string;
    const routeDisplay = recruitRoute || "정보 없음";

    // 길드에서 리크루터 롤 찾기
    const guild = channel.guild;
    const recruiterRoleName = recruiterRoleNames[recruitType];
    const recruiterRole = guild.roles.cache.find(
      (role) => role.name === recruiterRoleName,
    );

    if (!recruiterRole) {
      throw new Error(`리크루터 롤을 찾을 수 없습니다: ${recruiterRoleName}`);
    }

    await channel.send({
      content: `모든 리크루팅 절차가 완료되었습니다. 리크루터를 호출합니다...`,
    });

    // NIDU 리크룻인 경우 NIDU 리크루터 롤에 채널 권한 부여
    if (recruitType === "NIDU") {
      await channel.permissionOverwrites.create(recruiterRole.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        UseApplicationCommands: true,
      });
    }

    await channel.send({
      content: `<@&${recruiterRole.id}>\n\`\`\`가입 정보: \n\n가입 메인 캐릭터 명: ${mainCharacterName} \n가입 계기: ${routeDisplay} \n가입 꼽: ${recruitType}\`\`\``,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("SeAT 정보")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://seat.nisuwaz.com/character/${mainCharacterId}`),
          new ButtonBuilder()
            .setLabel("EveWho 정보")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://evewho.com/character/${mainCharacterId}`),
        ),
      ],
    });

    stateMachine.sendEvent(channelId, {
      type: "SUCCESS_CALL_RECRUITER",
      interaction: null,
    });
  }
}
