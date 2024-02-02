// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection } = require('discord.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,] });

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
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);