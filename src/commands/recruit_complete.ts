import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { SlashCommand } from '../library/types';

const FinishCounseling: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('상담완료')
		.setDescription('상담을 완료시킵니다.'),
	execute: interaction => {
		const buttonOk = new ButtonBuilder()
			.setCustomId('{"step":"finish-recruit","type":"yes"}')
			.setLabel('예')
			.setStyle(ButtonStyle.Success);

		const buttonNo = new ButtonBuilder()
			.setCustomId('{"step":"finish-recruit","type":"no"}')
			.setLabel('아니요')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonOk, buttonNo);

		void interaction.reply({
			content: '상담을 완료하면 상담 요청자가 해당 채널이 상담완료 카테고리로 옮겨지며 더 이상 대화를 나눌 수 없습니다. **__리크룻 중인 경우 상대방이 니수와 디스코드에 들어온 것__**을 반드시 확인 후 상담을 완료해 주십시오. 정말 상담을 완료하시겠습니까?',
			components: [row],
			ephemeral: true,
		});
	},
};

export default FinishCounseling;