// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection, ActivityType } = require('discord.js');

// load from .env if exists
try {
	const dotenv = require('dotenv');
	dotenv.config();
} catch (ex) {
    console.log('.env not found. using docker environment variable')
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,] });

// 이벤트 파일 init
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// 명령어 파일 init
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	// 공지 메시지 만드는 용
	// const noticeChannel = client.channels.cache.find(c => c.type === 0 &&  c.name === '안내');
	
	// const startRecruit = new ButtonBuilder()
	// 	.setCustomId('startRecruit')
	// 	.setLabel('가입 시작')
	// 	.setStyle(ButtonStyle.Success);

	// const startConv = new ButtonBuilder()
	// 	.setCustomId('startConv')
	// 	.setLabel('기타 문의')
	// 	.setStyle(ButtonStyle.Secondary);

	// const row = new ActionRowBuilder()
	// 	.addComponents(startRecruit, startConv);

	// noticeChannel.send({
	// 	content: `Nisuwaz 가입 절차를 시작하시려면 하단 '가입 시작' 버튼을, 다른 용무나 가입 관련 질문은 '기타 문의' 버튼을 통해 진행해 주세요`,
	// 	components: [row],
	// });

	// 활동 설정
	client.user.setPresence({
		activities: [{
			type: ActivityType.Custom,
			name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
			state: "리크루팅 관리 중",
		}]
	});
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);