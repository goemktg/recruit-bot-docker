import {
  Client,
  GatewayIntentBits,
  Events,
  TextChannel,
  ChannelType,
} from "discord.js";
import { loadEnvironmentVariables, setDefaultLogLevel } from "./lib/functions";
import { CommandsHandler } from "./lib/classes/CommandHandler";
import { DiscordHandler } from "./lib/classes/DiscordHandler";
import { RecruitHandler } from "./lib/classes/recruit/Handler";
import { StateBackup } from "./lib/classes/recruit/StateBackup";
import { announcementData, stateBackupChannelName } from "./static/data";
import log from "loglevel";
import cron from "node-cron";

loadEnvironmentVariables();
setDefaultLogLevel();

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN or DISCORD_TOKEN_FILE is required.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const recruitHandler = new RecruitHandler(client);

// State 백업 인스턴스 생성 (백업 채널 ID는 환경 변수에서 가져오기)
let stateBackup: StateBackup | null = null;

void client.login(process.env.DISCORD_TOKEN);

/**
 * 클라이언트 준비 이벤트 핸들러
 */
client.once(Events.ClientReady, (c) => {
  log.info(`Ready! Logged in as ${c.user.tag}`);

  void (async () => {
    client.commands = await CommandsHandler.getCommandsFromDir();
  })();

  void (async () => {
    // 허용된 길드 적용
    if (!process.env.DISCORD_RECRUIT_GUILD_ID) {
      throw new Error("DISCORD_RECRUIT_GUILD_ID is not set");
    }

    // guildType에 따라 환경변수에서 길드 ID 가져오기
    client.guildIdMap = {
      recruit: process.env.DISCORD_RECRUIT_GUILD_ID,
    };

    // State 백업 초기화
    stateBackup = new StateBackup(
      client,
      recruitHandler.getStateMachineHandler(),
      stateBackupChannelName,
      process.env.DISCORD_RECRUIT_GUILD_ID,
    );

    // 봇 시작 시 이전 state 복원 시도
    log.info("StateBackup: Attempting to restore previous state...");
    await stateBackup.restoreState(recruitHandler);

    // 안내 채널에 메시지 전송
    for (const [, item] of Object.entries(announcementData)) {
      const guildId = client.guildIdMap[item.guildType];
      if (!guildId) {
        log.warn(
          `AnnounceManager: Guild ID not found for guildType: ${item.guildType}`,
        );
        continue;
      }

      const guild = await client.guilds.fetch(guildId);
      log.info(
        `AnnounceManager: Processing ${item.guildType} guild: ${guild.name} (${guild.id})`,
      );

      const channel = await DiscordHandler.getChannelByName(
        client,
        guildId,
        item.channelName,
      );

      if (!channel) {
        log.warn(
          `AnnounceManager: Announcement channel not found: ${item.channelName} in ${item.guildType} guild`,
        );
        continue;
      }

      log.info(
        `AnnounceManager: Checking notice channel... for ${item.channelName} (${channel.id})`,
      );

      const messages = await channel.messages.fetch();
      if (messages.size === 0) {
        log.info("AnnounceManager: No message found. Sending new message...");
        await channel.send(item.msg);
      } else if (messages.first()?.content.trim() != item.msg.content?.trim()) {
        log.info(
          "AnnounceManager: Message is not same. Deleting old message and sending new message...",
        );
        await messages.first()?.delete();
        await channel.send(item.msg);
      } else {
        log.info("AnnounceManager: Message is same. ignoring...");
      }
    }
    log.info("AnnounceManager: Announcement check completed.");
  })();
});

/**
 * 인터랙션 생성 이벤트 핸들러
 */
client.on(Events.InteractionCreate, (interaction) => {
  void (async () => {
    // 슬래시 커맨드 처리
    if (interaction.isChatInputCommand() && interaction.guild) {
      CommandsHandler.executeCommand(interaction).catch(console.error);
      return;
    }

    // 리크룻 인터랙션 처리
    if (
      (interaction.isButton() ||
        interaction.isModalSubmit() ||
        interaction.isStringSelectMenu()) &&
      interaction.customId.startsWith("RECRUIT_")
    ) {
      await recruitHandler.handleRecruitInteraction(interaction);
      return;
    }
  })();
});

/**
 * 메시지 생성 이벤트 핸들러
 */
client.on(Events.MessageCreate, (message) => {
  void (async () => {
    // 봇 메시지, 특정 커맨드가 아닌 경우, 길드가 리크룻 길드가 아닌 경우 무시
    // log.debug("Received message:", message.author.bot, message.content, message.guildId, process.env.DISCORD_RECRUIT_GUILD_ID, !message.channel, message.channel.type !== ChannelType.GuildText);
    if (
      message.author.bot ||
      message.content != "/조건숙지함" ||
      message.guildId != process.env.DISCORD_RECRUIT_GUILD_ID ||
      !message.channel ||
      message.channel.type !== ChannelType.GuildText
    )
      return;

    log.debug("Handling agree conditions message...");
    // 조건 숙지함 메시지 처리
    await recruitHandler.handleAgreeConditionsMessage(
      message.channel as TextChannel,
    );
  })();
});

/**
 * 30분마다 state 백업 (옵션)
 */
cron.schedule("*/30 * * * *", () => {
  if (stateBackup) {
    log.info("Time to backup state!");
    void stateBackup.backupState();
  }
});

/**
 * 프로세스 종료 시그널 핸들러
 * 봇이 종료되기 전에 state를 백업
 */
const shutdownHandler = async (signal: string) => {
  log.info(`${signal} received. Backing up state before shutdown...`);

  if (stateBackup) {
    await stateBackup.backupState();
    log.info("State backup completed.");
  }

  // 디스코드 클라이언트 종료
  await client.destroy();
  log.info("Discord client destroyed.");

  process.exit(0);
};

// 다양한 종료 시그널 처리
process.on("SIGINT", () => void shutdownHandler("SIGINT"));
process.on("SIGTERM", () => void shutdownHandler("SIGTERM"));
process.on("SIGQUIT", () => void shutdownHandler("SIGQUIT"));

// Uncaught Exception 처리 (백업 후 종료)
process.on("uncaughtException", (error) => {
  void (async () => {
    log.error("Uncaught Exception:", error);

    if (stateBackup) {
      await stateBackup.backupState();
    }

    process.exit(1);
  })();
});
