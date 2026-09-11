import { SlashCommandBuilder, TextChannel, VoiceChannel } from "discord.js";
import { SlashCommand } from "../lib/types";
import { DiscordHandler } from "../lib/classes/DiscordHandler";

const FinishTalk: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("상담완료")
    .setDescription("현재 채널의 상담을 완료시킵니다.")
    .setDefaultMemberPermissions(0),
  execute: async (interaction) => {
    const currentChannel = interaction.channel;

    if (currentChannel === null) {
      throw Error("현재 채널을 찾을 수 없습니다.");
    }

    if (!(
      currentChannel instanceof TextChannel ||
      currentChannel instanceof VoiceChannel
    )) {
      throw Error("텍스트 채널이나 음성 채널에서만 사용할 수 있습니다.");
    }

    await DiscordHandler.archiveChannel(
      interaction,
      currentChannel,
      "상담 완료",
      "Move",
    );
  },
  guildType: "recruit",
};

export default FinishTalk;
