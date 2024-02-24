const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require('discord.js');
const { loadEnvironmentVariables } = require('./library/functions.js');

loadEnvironmentVariables();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commandsHandler = (new require('./library/commands-handler.js'))();
const { commands } = commandsHandler.getCommands();
client.commands = commands;

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	// 공지 채널이 비었으면 공지 메시지를 새로 보냄
	const targetChannel = readyClient.channels.cache.find(channel => channel.name === '안내' && channel.guildId === process.env.DEPLOY_TARGET_GUILD_ID);
	const messages = await targetChannel.messages.fetch({ limit: 1 });

	if (!messages.some(item => item)) {
		console.log('No messages in notice channel. making new one...');

		const startRecruit = new ButtonBuilder()
			.setCustomId('startRecruit')
			.setLabel('가입 시작')
			.setStyle(ButtonStyle.Success);

		const startConv = new ButtonBuilder()
			.setCustomId('startConv')
			.setLabel('기타 문의')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(startRecruit, startConv);

		targetChannel.send({
			content: 'Nisuwaz 가입 절차를 시작하시려면 하단 \'가입 시작\' 버튼을, 다른 용무나 가입 관련 질문은 \'기타 문의\' 버튼을 통해 진행해 주세요',
			components: [row],
		});
	}

	// 활동 설정
	client.user.setPresence({
		activities: [{
			type: ActivityType.Custom,
			name: 'custom',
			state: '리크루팅 관리 중',
		}],
	});
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	commandsHandler.executeCommands(interaction);
});