import {
  Client,
  TextChannel,
  ChannelType,
  ChatInputCommandInteraction,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  MessageCreateOptions,
  VoiceChannel,
  CategoryChannelResolvable,
  CollectorFilter,
  MessageComponentInteraction,
} from "discord.js";
import log from "loglevel";

export class DiscordHandler {
  /**
   * 채널 ID로 채널 가져오기
   */
  static async getChannelById(
    client: Client,
    channelId: string,
  ): Promise<TextChannel | null> {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        return channel as TextChannel;
      }
    } catch (error) {
      log.error("Error fetching channel:", error);
    }

    return null;
  }

  static async getChannelByName(
    client: Client,
    guildId: string,
    channelName: string,
  ): Promise<TextChannel | null> {
    try {
      const guild = await client.guilds.fetch(guildId);
      const channel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && c.name === channelName,
      ) as TextChannel | undefined;

      return channel ?? null;
    } catch (error) {
      log.error("Error fetching channel by name:", error);
      return null;
    }
  }

  /*
   * 공지 메시지를 format 해서 반환합니다
   */
  static returnAnnouncementMsg() {
    /**
     * Nisuwa Cartel 인액티브 안내 메시지
     * TODO: 만들어봐?
     */
    // const nisInactiveMsg: MessageCreateOptions = {
    //     content: "왜 이 채널이 보이나요? \nNisuwa Cartel에서는 일정 기간 활동이 없는 멤버에게 인액티브(비활동) 롤을 부여하고 있습니다. 인액티브 롤이 부여된 멤버는 콥 채널 및 일부 중요 카테고리에 대한 접근 권한이 제한될 수 있습니다. \n\n어떻게 인액티브에서 벗어나나요? \n \n\n마지막 수정일: 2025/12/15",
    // };

    /**
     * 리크룻 안내 메시지
     */
    const startRecruit = new ButtonBuilder()
      .setCustomId("RECRUIT_START_SESSION")
      .setStyle(ButtonStyle.Success)
      .setLabel("가입 시작");

    const startDaehwa = new ButtonBuilder()
      .setCustomId("RECRUIT_START_DAEHWA")
      .setStyle(ButtonStyle.Secondary)
      .setLabel("기타 문의");

    const recruitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      startRecruit,
      startDaehwa,
    );

    const recruitMsg: MessageCreateOptions = {
      content:
        "Nisuwaz / Nisuwa Dairy Union 가입 절차를 시작하시려면 하단 '가입 시작' 버튼을, 다른 용무나 가입 관련 질문은 '기타 문의' 버튼을 통해 진행해 주세요 \n\n마지막 수정일 2025/12/17",
      components: [recruitRow],
    };

    return { recruitMsg };
  }

  /**
   * 채널 아카이빙
   */
  static async archiveChannel(
    interaction: ChatInputCommandInteraction,
    targetChannel: TextChannel | VoiceChannel,
    actionName: string,
    action: "Copy" | "Move",
    ephemeral: boolean = false,
  ) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("yes")
          .setLabel("예")
          .setStyle(ButtonStyle.Success),
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("no")
          .setLabel("아니요")
          .setStyle(ButtonStyle.Danger),
      );

    const targetChannelName = `<#${targetChannel.id}> 채널`;
    let responseString = targetChannelName;

    const actionDescription =
      action === "Copy"
        ? "아카이브하고 복사본을 만듭니다"
        : "아카이브로 이동합니다";

    await interaction.reply({
      content: `정말 ${actionName}을(를) 하시겠습니까?\n${targetChannelName}을 ${actionDescription}.`,
      components: [row],
      ephemeral: ephemeral,
    });

    const filter: CollectorFilter<[MessageComponentInteraction<"cached">]> = (
      i,
    ) => i.customId === "yes" || i.customId === "no";

    if (interaction.channel === null)
      throw Error("명령어 입력 채널을 찾을 수 없습니다.");
    if (!(interaction.channel instanceof TextChannel))
      throw Error("명령어 입력 채널은 텍스트 채널이어야 합니다.");

    let collected;
    try {
      collected = await interaction.channel.awaitMessageComponent({
        filter,
        time: 30000,
      });
    } catch (error) {
      await interaction.editReply({
        content: `${actionName} 확인 시간이 초과되었습니다. 다시 시도해주세요.`,
        components: [],
      });
      return;
    }

    await collected.update({
      content: responseString + ` ${actionName} 작업을 시작합니다...`,
      components: [],
    });

    if (collected.customId === "yes") {
      if (interaction.guild === null)
        throw Error("명령어 입력 길드를 찾을 수 없습니다.");

      const targetCategories = interaction.guild.channels.cache.filter(
        (c) => c.type === ChannelType.GuildCategory && c.name === "아카이브",
      );

      switch (targetCategories.size) {
        case 1:
          // Copy: 복사본 생성 후 원본을 아카이브로 이동
          if (action === "Copy") {
            await targetChannel.clone();
          }

          const today = new Date();
          const year = today.getFullYear();
          const month = ("0" + (today.getMonth() + 1)).slice(-2);
          const day = ("0" + today.getDate()).slice(-2);

          await targetChannel.setName(
            targetChannel.name + "_" + year + "-" + month + "-" + day,
          );

          await targetChannel.setParent(
            targetCategories.first()?.id as CategoryChannelResolvable,
            { lockPermissions: true },
          );

          responseString += `의 ${actionName} 작업을 성공적으로 완료했습니다!`;
          break;
        case 0:
          throw Error("`아카이브` 라는 이름의 카테고리가 없습니다.");
        default:
          throw Error("`아카이브` 라는 이름의 카테고리가 한 개가 아닙니다.");
      }
    } else {
      responseString += ` ${actionName} 작업을 취소했습니다.`;
    }

    await interaction.editReply({ content: responseString });
  }
}
