const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		member.send('안녕하세요! Nisuwaz 가입 안내 봇입니다. https://discord.com/channels/1200337363042312212/1200337363042312216/1200694031664033832 를 참고해 주세요!');
	},
};