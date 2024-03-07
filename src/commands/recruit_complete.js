const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('상담완료')
		.setDescription('상담을 완료시킵니다.'),
	async execute(interaction) {

		const buttonOk = new ButtonBuilder()
			.setCustomId('recruitFinOk')
			.setLabel('예')
			.setStyle(ButtonStyle.Success);

		const buttonNo = new ButtonBuilder()
			.setCustomId('recruitFinNo')
			.setLabel('아니요')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(buttonOk, buttonNo);

		await interaction.reply({
			content: '상담을 완료하면 상담 요청자가 해당 채널이 상담완료 카테고리로 옮겨지며 더 이상 대화를 나눌 수 없습니다. **__리크룻 중인 경우 상대방이 니수와 디스코드에 들어온 것__**을 반드시 확인 후 상담을 완료해 주십시오. 정말 상담을 완료하시겠습니까?',
			components: [row],
			ephemeral: true,
		});

		await interaction.channel.awaitMessageComponent({
			// timeout (60sec)
			time: 60000,
		}).then(async submitted => {
			if (submitted.customId == 'recruitFinNo') {
				// 취소
				await submitted.update({ content: '상담 완료 명령이 취소되었습니다.', components: [] });
				return;
			}

			await submitted.update({ content: '상담 완료 명령을 처리 중입니다...', components: [] });
			const today = new Date();

			const year = today.getFullYear();
			const month = ('0' + (today.getMonth() + 1)).slice(-2);
			const day = ('0' + today.getDate()).slice(-2);

			const targetCategories = submitted.guild.channels.cache.filter(c => c.type === 4 && c.name === '상담완료');

			await submitted.channel.setParent(targetCategories.entries().next().value[1].id);
			await submitted.channel.setName(submitted.channel.name + '_' + year + '-' + month + '-' + day);
			await submitted.channel.lockPermissions();
			await submitted.channel.send(`${submitted.member.nickname}님이 상담완료 명령을 사용하여 이 채널을 완료 처리 하였습니다.`);
		})
			.catch(async error => {
				if (error.message == 'Collector received no interactions before ending with reason: time') {
					await interaction.editReply({ content: '입력 시간이 초과되었습니다. (60초)', components: [] });
				}
				else {
					await interaction.editReply({ content: '처리중 오류가 발생했습니다.', components: [] });
					console.log(error);
				}
			});
	},
};