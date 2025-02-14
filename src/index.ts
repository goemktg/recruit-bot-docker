import {
  Client,
  Events,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageCreateOptions,
} from "discord.js";
import {
  loadEnvironmentVariables,
  sendAnnouncementMsgs,
  setDefaultLogLevel,
  setDiscordPresence,
} from "./library/functions";
import { CommandsHandler } from "./library/classes/CommandHandler";
import { RecruitHandler } from "./recruitHandler";

loadEnvironmentVariables();
setDefaultLogLevel();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commandsHandler = new CommandsHandler();
const recruitHandler = new RecruitHandler();

void client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  void (async () => {
    client.commands = await commandsHandler.getCommandsFromDir();
  })();

  const startRecruit = new ButtonBuilder()
    .setCustomId('{"step":"create-channel","type":"recruit"}')
    .setStyle(ButtonStyle.Success)
    .setLabel("가입 시작");

  const startDaehwa = new ButtonBuilder()
    .setCustomId('{"step":"create-channel","type":"daehwa"}')
    .setStyle(ButtonStyle.Secondary)
    .setLabel("기타 문의");

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    startRecruit,
    startDaehwa,
  );

  const message =
    "Nisuwaz / Corn Soup. Industrial 가입 절차를 시작하시려면 하단 '가입 시작' 버튼을, 다른 용무나 가입 관련 질문은 '기타 문의' 버튼을 통해 진행해 주세요 \n마지막 수정일 2024/05/27";
  const channelMsg: MessageCreateOptions = {
    content: message,
    components: [row],
  };

  void sendAnnouncementMsgs(client, channelMsg);

  setDiscordPresence(readyClient, "리크루팅 관리 중");
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  void commandsHandler.executeCommand(interaction);
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isButton()) return;

  void recruitHandler.handleRecruitStep(interaction, interaction.customId);
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  void recruitHandler.handleRecruitStep(interaction, interaction.customId);
});

client.on(Events.GuildMemberAdd, (member) => {
  void member.send(
    "안녕하세요! Nisuwaz 가입 안내 봇입니다. https://discord.com/channels/1200337363042312212/1200337363042312216/1200694031664033832 를 참고해 주세요!",
  );
});

client.on(Events.MessageCreate, (message) => {
  if (message.content != "/조건숙지함") return;

  void recruitHandler.handleRecruitStep(
    message,
    '{"step":"start-enter-main-char"}',
  );
});
