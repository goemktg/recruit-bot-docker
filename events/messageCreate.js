const { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { checkRecruitStage, makeMessageLink } = require('../library/functions.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.content != '/조건숙지함') return;
		const confirmString = '조건 숙지를 확인했습니다. 다음으로 하단 버튼을 눌러 나오는 메뉴에서 **자신의 메인 캐릭터 명**을 입력해 주세요.';

		const isPassed = await checkRecruitStage(message.channel, confirmString);
		if (!isPassed[0]) {
			await message.channel.send(`이미 조건 숙지를 확인했습니다. ${makeMessageLink(isPassed[1])} 해당 메시지의 버튼을 통해 진행해 주세요.`);
			return;
		}
		const startInputName = new ButtonBuilder()
			.setCustomId('startInputName')
			.setLabel('입력하기')
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder()
			.addComponents(startInputName);

		await message.channel.send({
			content: confirmString,
			components: [row],
		});
	},
};