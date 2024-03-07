import { ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

export class RecruitHandler {
	constructor() {
		this.confirmString = {
			masterCondition: '조건 숙지를 확인했습니다. 다음으로 하단 버튼을 눌러 나오는 메뉴에서 **자신의 메인 캐릭터 명**을 입력해 주세요.',
			mainChar: '메인 계정이 확인되었습니다. 아래 정보가 맞는지 확인하시고, 그 아래 박스에서 리크룻 경로를 선택해 주세요.',
			agreeInformal: '반말 동의를 확인했습니다.\n\n저희 코퍼레이션은 기본적으로 PvP 지향 코퍼레이션으로, 최소한의 PvP활동을 하셔야 합니다. 동의하시면 하단 버튼을 눌러주세요.',
			agreePVP: 'PVP 동의를 확인했습니다.\n\n아래 \'SeAT\' 버튼을 눌러 웹사이트를 방문하여 이브온라인 계정으로 로그인한 뒤, 메인 캐릭터를 등록하고 \'등록 완료\'버튼을 눌러주세요. 스파이 방지 등을 위해 필요한 절차입니다.\n**API의 한계로 정보를 받아오는 데 10~30분 정도의 시간이 걸립니다.** 그 동안 혹시 알트가 있으시다면 아래 \'가이드\' 버튼을 눌러 나오는 사이트를 참고하여 알트를 추가해 주세요.',
			recruitRoute: '리크룻 경로가 다음과 같이 선택되었습니다:',
		};
	}

	// TODO: 더 깔끔한 로직으로 변경 필요
	async checkRecruitStage(channel, recruitString) {
		// 메시지 포인터 생성
		let message = await channel.messages
			.fetch({ limit: 1 })
			.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
		// 만약 첫번째 항목이 찾는 항목일 경우 즉시 리턴
		if (message.content == recruitString) return [false, message];

		while (message) {
			const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });

			for (const msg of messagePage) {
				if (msg[1].author.id == 1091569359794737242n && msg[1].content == recruitString) {
					return [false, msg[1]];
				}
			}

			// 메시지 포인터를 페이지의 마지막 메시지로 업데이트
			message = messagePage.size > 0 ? messagePage.at(messagePage.size - 1) : null;
		}

		return [true];
	}

	// TODO : 더 깔끔한 로직으로 변경 필요
	async getRecruitInfo(channel, recruitStringArr) {
		const returnObject = {};

		// Create message pointer
		let message = await channel.messages
			.fetch({ limit: 1 })
			.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

		while (message) {
			const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });

			for (const msg of messagePage) {
				const recruitStringArrIndex = recruitStringArr.indexOf(msg[1].content);

				if (msg[1].author.id == 1091569359794737242n && recruitStringArrIndex !== -1) {
					recruitStringArr.splice(recruitStringArrIndex, 1);
					returnObject[msg[1].content] = msg[1];
				}

				if (recruitStringArr.length === 0) {
					return returnObject;
				}
			}

			// Update our message pointer to be the last message on the page of messages
			message = messagePage.size > 0 ? messagePage.at(messagePage.size - 1) : null;
		}
	}

	makeMessageLink(message) {
		return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
	}

	isBanTarget(charInfoByType, recruiterRoleID) {
		const { banData, banDataStringMapping } = require('./data.js');

		let returnBoolean = false;
		let returnString = '';

		for (const type in banData) {
			const currentData = banData[type];
			Object.entries(currentData).some(prop => {
				const set = new Set(prop[1]);

				charInfoByType[prop[0]].forEach((item) => {

					// 입갤밴 목록에 있음
					if (set.has(item)) {
						if (!returnBoolean) {
							returnBoolean = true;
							returnString = `<@&${recruiterRoleID}> 주의! 현재 리크룻 중인 캐릭터 **${charInfoByType['char'][0]}**은(는) 밴 리스트에 등재되어 있습니다. 반드시 참고하시고 리크룻 바랍니다.\`\`\`밴 리스트는 다음과 같습니다:`;
						}
						returnString += `\n기록 중 ${item} ${banDataStringMapping[prop[0]]} ${banDataStringMapping[type]} 대상입니다`;
					}
				});
			});
		}

		return [returnBoolean, returnString + '```'];
	}

	//
	// 이미 리크룻/문의 채널이 있는지 확인 후 리크룻/문의 채널 생성
	//
	async startConvOrRecruit(interaction) {
		const matchingChannels = await interaction.guild.channels.fetch()
			.then(channels => channels.filter(c => c.type === 0 && c.name.split('-')[0] === interaction.user.tag));

		if (matchingChannels.size > 0) {
			await interaction.reply({
				content: `이미 전용 채널이 생성되었습니다! 다음 단계를 ${matchingChannels.entries().next().value[1]} 채널 에서 진행해 주세요.`,
				ephemeral: true,
			});

			return;
		}

		const consultingCategory = interaction.guild.channels.cache.find(c => c.type === 4 && c.name === '상담중');
		const recruiterRole = interaction.guild.roles.cache.find(role => role.name == '리크루터');

		let responseType = '';
		if (interaction.customId == 'startRecruit') responseType = '리크룻';
		if (interaction.customId == 'startConv') responseType = '문의';

		const consultingChannel = await consultingCategory.children.create({
			name: interaction.user.tag + '-' + responseType,
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					id: interaction.user.id,
					allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
				},
				{
					id: recruiterRole.id,
				},
			],
		});

		let responseMsg = '';

		if (interaction.customId == 'startRecruit') {
			responseMsg =
						`**${interaction.user.tag}**님 어서오세요! ` + '저희 Nisuwaz는 로우 시큐리티 PvP 콥으로써 __**다음 내용을 충분히 숙지**__하시고 가입해주시기 바랍니다. 봇을 통한 자동 가입 절차를 모두 완료하시면 리크루터가 자동으로 호출됩니다. 가입 도중 질문이 있으시다면 언제든 `@리크루터`를 입력하여 리크루터를 호출하시면 됩니다.\n\n\n'
						+ '1. Nisuwaz는 로섹 PvP콥으로, 지속적인 PvP 활동으로 인해 시큐리티가 하락하여 하이섹 통행에 불편함이 생김에 따라서 저희 콥에서는 하이섹 통행을 금지하고 있습니다. 대신 스테이징 성계인 니수와 <=> 지타간 자체 운송 시스템이 있습니다.\n\n'
						+ '2. 개인별 시큐리티는 PvP하면서 어쩔 수 없이 떨어지게 되어있으며 다시 올릴 수 있는 방법이 여러가지가 있으니 크게 문제되는 부분은 아닙니다.\n\n'
						+ '3. 또한 일이 있어도 블루는 공격하면 안됩니다. 블루에게 공격받았을 경우 스크린샷을 찍지 않고 반격하여 상대를 죽였을 경우, 증거가 없기 때문에 오히려 잘못을 뒤집어쓸 가능성이 있습니다. 블루에게 공격받았을 경우 스크린샷을 찍고 리더쉽에게 제출하여 상황을 설명해주셔야 합니다.\n\n'
						+ '4. 저희 Nisuwaz는 오메가 계정만 가입을 받고 있습니다. 알파 계정은 바로 오메가를 결제할 예정일 경우에만 가입상담 가능합니다.\n\n'
						+ '위의 사항에 모두 동의하며 숙지하셨다면 아래에 `/조건숙지함`이라는 글자를 입력하여 다음 절차를 진행하실 수 있습니다.';
		}

		if (interaction.customId == 'startConv') {
			responseMsg =
						'문의 채널이 개설되었습니다. 해당 채널은 Nisuwaz 리더쉽과 리크루터들만 볼 수 있습니다. 오직 리더쉽만 봐야 하는 내용이라면 해당 디스코드 인원 중 `goem_`에게 디스코드 dm 혹은 인게임 `Esiz AL`, `RI YURI`, `Goem Funaila` 중 하나 혹은 모두에게 인게임 메일로 보내주세요.';
		}

		await consultingChannel.send(responseMsg);
		await interaction.reply({
			content: `전용 채널이 생성되었습니다! 다음 절차를 ${consultingChannel} 채널 에서 진행해 주세요.`,
			ephemeral: true,
		});
	}

	//
	// /조건숙지함 채팅 확인 후 메인 캐릭터 이름 입력 폼을 보냄
	//
	async masterCondition(message) {
		const confirmString = this.confirmString.masterCondition;

		const isPassed = await this.checkRecruitStage(message.channel, confirmString);
		if (!isPassed[0]) {
			await message.channel.send(`이미 조건 숙지를 확인했습니다. ${this.makeMessageLink(isPassed[1])} 해당 메시지의 버튼을 통해 진행해 주세요.`);
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
	}

	//
	// 메인 캐릭터 이름 입력 폼을 받고 캐릭터 정보를 확인한 뒤 리크룻 경로 선택 메뉴를 보냄
	// + 밴 대상인지 확인하고 밴 대상이면 리크루터 채널에 밴 내용 전송
	async startInputName(interaction) {
		const isPassed = await this.checkRecruitStage(interaction.channel, this.confirmString.mainChar);
		if (!isPassed[0]) {
			await interaction.reply(`이미 메인 캐릭터를 확인했습니다. 다음 단계를 ${this.makeMessageLink(isPassed[1])} 해당 메시지의 선택 메뉴를 통해 진행해 주세요.`);
			return;
		}

		const modal = new ModalBuilder()
			.setCustomId('inputNameModal')
			.setTitle('메인 캐릭터 이름 입력');

		const maincharnameInput = new TextInputBuilder()
			.setMinLength(3)
			.setMaxLength(37)
			.setCustomId('maincharnameInput')
			.setLabel('메인 캐릭터의 이름을 입력하여 주십시오.')
			.setPlaceholder('예시) Goem Funaila')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const row = new ActionRowBuilder().addComponents(maincharnameInput);
		modal.addComponents(row);

		await interaction.showModal(modal);

		const submitted = await interaction.awaitModalSubmit({
			// timeout (60sec)
			time: 60000,
			filter: i => i.user.id === interaction.user.id,
		}).catch(error => {
			console.log(error);
			return;
		});

		if (submitted) {
			await submitted.deferReply();

			const mainCharacterName = submitted.fields.getTextInputValue('maincharnameInput').trim();

			const esiRequest = new (require('./library/esi-request.js'))();
			const mainCharacterId = (await esiRequest.getIdsFromNames([mainCharacterName])).characters[0].id;
			const mainCharacterCorpHistory = await esiRequest.getCorpHistory(mainCharacterId);
			const corpNames = await esiRequest.getNamesFromIds([...new Set(mainCharacterCorpHistory.map(entry => entry.corporation_id))]);

			const corpIdToNameMap = new Map(corpNames.map(corp => [corp.id, corp.name]));
			const corpHistory = mainCharacterCorpHistory.map((obj, index) => {
				// 시간 잘라내고 날짜만 사용
				const startDate = obj.start_date.split('T')[0];
				// map 이용해 name 가져오기
				const corporationName = corpIdToNameMap.get(obj.corporation_id);

				// 첫번째 값이 아니면 그 전 레코드의 값 가져오기
				const previousEndDate = index > 0 ? mainCharacterCorpHistory[index - 1].start_date.split('T')[0] : null;

				return `${startDate}~${previousEndDate || ''} ${corporationName}`;
			}).join('\n');

			const charInfoEmbed = new EmbedBuilder()
				.setTitle(mainCharacterName + ' : ' + mainCharacterId)
				.setThumbnail(`https://images.evetech.net/characters/${mainCharacterId}/portrait?size=128`)
				.setDescription('```' + corpHistory + '```');

			const recruitRouteSelectMenu = new StringSelectMenuBuilder()
				.setCustomId('recruitRoute')
				.setPlaceholder('리크룻 경로를 선택해 주세요!')
				.addOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel('DC인사이드 이브 온라인 갤러리 리크룻 광고글')
						.setValue('DC인사이드 이브 온라인 갤러리 리크룻 광고글'),
					new StringSelectMenuOptionBuilder()
						.setLabel('네이버 카페 리크룻 광고글')
						.setValue('네이버 카페 리크룻 광고글'),
					new StringSelectMenuOptionBuilder()
						.setLabel('지인 추천')
						.setValue('지인 추천'),
					new StringSelectMenuOptionBuilder()
						.setLabel('리크루터 직접 리크룻')
						.setValue('리크루터 직접 리크룻'),
					new StringSelectMenuOptionBuilder()
						.setLabel('기타')
						.setValue('기타'),
				);

			const recruitRouteRow = new ActionRowBuilder()
				.addComponents(recruitRouteSelectMenu);

			await submitted.editReply({
				content: this.confirmString.mainChar,
				embeds: [charInfoEmbed],
				components: [recruitRouteRow],
			});

			const charInfoByType = {
				'char': [mainCharacterName],
				'corp': corpNames.map(corporation => corporation.name),
			};

			const recruiterRole = interaction.guild.roles.cache.find(role => role.name == '리크루터');
			const [isBan, reason] = this.isBanTarget(charInfoByType, recruiterRole.id);

			if (isBan) {
				await submitted.guild.channels.cache.find(channel => channel.name === '리크루터-working').send(reason);
			}
		}
	}

	//
	// 리크룻 경로 선택 입력을 받고 기타 선택시 기타 경로 입력 폼을 보냄.
	// 그 후 반말 동의 확인 폼을 보냄
	//
	async confirmStringRoute(interaction) {
		const isPassed = await this.checkRecruitStage(interaction.channel, this.confirmString.recruitRoute);
		if (!isPassed[0]) {
			await interaction.reply(`이미 리크룻 경로를 선택했습니다. 다음 단계를 ${this.makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
			return;
		}

		const selectedRecruitRoute = interaction.values[0];
		let result;

		if (selectedRecruitRoute == '기타') {
			const modal = new ModalBuilder()
				.setCustomId('inputRecruitRouteETC')
				.setTitle('기타 리크룻 경로 세부 사항 입력');

			const recruitRouteEtcInput = new TextInputBuilder()
				.setCustomId('recruitRouteEtcInput')
				.setLabel('기타 경로의 세부 사항을 입력해 주세요.')
				.setPlaceholder('예시) 지인은 아니지만 xx에게 추천받아 가입')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const row = new ActionRowBuilder().addComponents(recruitRouteEtcInput);
			modal.addComponents(row);

			await interaction.showModal(modal);

			const submitted = await interaction.awaitModalSubmit({
				// timeout (60sec)
				time: 60000,
				filter: i => i.user.id === interaction.user.id,
			}).catch(error => {
				console.log(error);
				return;
			});

			if (submitted) {
				result = await submitted.fields.getTextInputValue('recruitRouteEtcInput');
				interaction = submitted;
			}
		}

		if (result) {
			result = '\n상세 정보: ' + result;
		}
		else {
			result = '';
		}
		const recruitRouteEmbed = new EmbedBuilder()
			.setDescription('```' + '경로: ' + selectedRecruitRoute + result + '```');

		const agreeInformal = new ButtonBuilder()
			.setCustomId('agreeInformal')
			.setLabel('반말 동의함')
			.setStyle(ButtonStyle.Success);

		const row = new ActionRowBuilder()
			.addComponents(agreeInformal);

		await interaction.reply({
			content: this.confirmString.recruitRoute,
			embeds: [recruitRouteEmbed],
		});

		await interaction.followUp({
			content: '저희 코퍼레이션은 기본적으로 반말을 허용하고 있습니다. 동의하시면 아래 버튼을 눌러주세요.',
			components: [row],
		});
	}

	//
	// 반말 동의함 버튼 클릭을 받고 PVP 동의 확인 폼을 보냄
	//
	async agreeInformal(interaction) {
		const confirmString = this.confirmString.agreeInformal;
		const isPassed = await this.checkRecruitStage(interaction.channel, confirmString);
		if (!isPassed[0]) {
			await interaction.reply(`이미 반말 동의를 확인했습니다. 다음 단계를 ${this.makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
			return;
		}

		const agreePVP = new ButtonBuilder()
			.setCustomId('agreePVP')
			.setLabel('PVP 동의함')
			.setStyle(ButtonStyle.Success);

		const row = new ActionRowBuilder()
			.addComponents(agreePVP);

		await interaction.reply({
			content: confirmString,
			components: [row],
		});
	}

	//
	// PVP 동의함 버튼 클릭을 받고 SeAT 가입 정보 확인 폼을 보냄
	//
	async agreePVP(interaction) {
		const isPassed = await this.checkRecruitStage(interaction.channel, this.confirmString.agreePVP);
		if (!isPassed[0]) {
			await interaction.reply(`이미 PVP 동의를 확인했습니다. 다음 단계를 ${this.makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
			return;
		}

		const registrationEnd = new ButtonBuilder()
			.setCustomId('registrationEnd')
			.setLabel('등록 완료')
			.setStyle(ButtonStyle.Success);

		const seatLink = new ButtonBuilder()
			.setLabel('SeAT')
			.setStyle(ButtonStyle.Link)
			.setURL('https://seat.nisuwaz.com/');

		const guideLink = new ButtonBuilder()
			.setLabel('가이드')
			.setStyle(ButtonStyle.Link)
			.setURL('https://forums.nisuwaz.com/t/seat/224');

		const row = new ActionRowBuilder()
			.addComponents(registrationEnd, seatLink, guideLink);

		await interaction.reply({
			content: this.confirmString.agreePVP,
			components: [row],
		});
	}

	//
	// SeAT 가입 완료 버튼 클릭을 받고 가입 정보를 가져와 가입 끝 폼을 보냄
	//
	async registrationEnd(interaction) {
		const confirmString = 'SeAT 가입이 인증되었습니다. 리크루터를 호출합니다.';
		const isPassed = await this.checkRecruitStage(interaction.channel, confirmString);
		if (!isPassed[0]) {
			await interaction.reply('이미 모든 절차를 마쳤습니다. 리크루터와의 상담 부탁드립니다.');
			return;
		}

		await interaction.deferReply();

		const headers = {
			'accept': 'application/json',
			'X-TOKEN': process.env.SEAT_TOKEN,
		};

		// const maincharData = (await checkRecruitStage(interaction.channel, ConfirmStringMainchar))[1];
		const recruitData = await this.getRecruitInfo(interaction.channel, [this.confirmString.mainChar, this.confirmString.recruitRoute]);

		const [maincharName, maincharId] = recruitData[this.confirmString.mainChar].embeds[0].data.title.split(':').map(item => item.trim());

		console.log(recruitData[this.confirmString.mainChar].embeds[0].data.title.split(':').map(item => item.trim()));

		const axios = require('axios');
		const seatData = await axios.get('https://seat.nisuwaz.com/api/v2/character/sheet/' + maincharId, { headers });

		if (await seatData.status != 200 || await seatData.statusText != 'OK') {
			await interaction.editReply('시트 인증에 실패했습니다. 10 ~ 30분 후 다시 시도해 주세요.');
		}
		else {
			const recruitRouteString = recruitData[this.confirmString.recruitRoute].embeds[0].data.description.replace('\n', ', ').replace('```', '').replace('```', '');

			await interaction.editReply(confirmString);

			const recruiterRole = interaction.guild.roles.cache.find(role => role.name == '리크루터');
			const recruitDetailString = `<@&${recruiterRole.id}>` + '\n```가입 정보:\n\n' +
            `가입 캐릭터 명: ${maincharName}\n` +
            `가입 ${recruitRouteString}\n` +
            '반말, PVP 동의' + '```';

			const seatLink = new ButtonBuilder()
				.setLabel('SeAT 정보')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://seat.nisuwaz.com/characters/${maincharId}/sheet`);

			const evewhoLink = new ButtonBuilder()
				.setLabel('EveWho 정보')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://evewho.com/character/${maincharId}`);

			const row = new ActionRowBuilder()
				.addComponents(seatLink, evewhoLink);

			await interaction.channel.send({
				content: recruitDetailString,
				components: [row],
			});
		}
	}
};