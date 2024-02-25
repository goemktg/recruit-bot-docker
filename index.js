/* eslint-disable no-mixed-spaces-and-tabs */
const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require('discord.js');
const { loadEnvironmentVariables } = require('./library/functions.js');

loadEnvironmentVariables();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// TODO : commandsHandler -> CommandsHandler
const commandsHandler = new (require('./library/commands-handler.js'))();
const { commands } = commandsHandler.getCommands();
client.commands = commands;

const recruitHandler = new (require('./recruit-handler.js'))();

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	// 공지 채널이 비었으면 공지 메시지를 새로 보냄
	const targetChannels = readyClient.channels.cache.filter(channel => channel.name === '안내');

	for (const targetChannel of targetChannels.values()) {
		console.log(`Checking notice channel... in guild :${targetChannel.guild.name} (${targetChannel.guild.id})`);
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

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.customId == 'startRecruit' || interaction.customId == 'startConv') {recruitHandler.startConvOrRecruit(interaction);}
	else if (interaction.customId == 'startInputName') {recruitHandler.startInputName(interaction);}
	else if (interaction.customId == 'agreeInformal') {recruitHandler.agreeInformal(interaction);}
	else if (interaction.customId == 'agreePVP') {recruitHandler.agreePVP(interaction);}
	else if (interaction.customId == 'registrationEnd') {recruitHandler.registrationEnd(interaction);}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isStringSelectMenu()) return;

	recruitHandler.confirmStringRoute(interaction);
});

client.on(Events.GuildMemberAdd, async member => {
	member.send('안녕하세요! Nisuwaz 가입 안내 봇입니다. https://discord.com/channels/1200337363042312212/1200337363042312216/1200694031664033832 를 참고해 주세요!');
});

client.on(Events.MessageCreate, async message => {
	if (message.content != '/조건숙지함') return;

	recruitHandler.masterCondition(message);
});