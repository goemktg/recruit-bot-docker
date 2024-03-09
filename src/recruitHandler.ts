import { ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType, TextChannel, ButtonInteraction, CategoryChannel, Message, CacheType, EmbedBuilder, StringSelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import log from 'loglevel';
import { EsiRequester } from './library/handlers/EsiRequester';
import { SeatRequester } from './library/handlers/SeatRequester';
import { banData, banDataStringMap, recruitStepData } from './recruitData';

interface BanCharInfo {
	'char': string[];
	'corp': string[];
}

interface NextStepDataBase {
	step: 'create-channel' | 'start-recruit' | 'start-enter-main-char' | 'enter-main-char' | 'seleted-recruit-route' | 'start-agree-infomal' | 'start-agree-pvp' | 'start-seat-registration' | 'confirm-seat-registration' | 'finish-recruit';
}

interface NextStepCreateChannel extends NextStepDataBase {
	step: 'create-channel';
	type: 'recruit' | 'conv';
}

interface NextStepStartRecruit extends NextStepDataBase {
	step: 'start-recruit';
	type: 'nisuwaz' | 'consui';
}

interface NextStepStartEnterMainChar extends NextStepDataBase {
	step: 'start-enter-main-char';
}

interface NextStepEnterMainChar extends NextStepDataBase {
	step: 'enter-main-char';
}

interface NextStepSelectedRecruitRoute extends NextStepDataBase {
	step: 'seleted-recruit-route';
}

interface NextStepStartAgree extends NextStepDataBase {
	step: 'start-agree-infomal' | 'start-agree-pvp';
}

interface NextStepStartSeatRegistration extends NextStepDataBase {
	step: 'start-seat-registration';
}

interface NextStepConfirmSeatRegistration extends NextStepDataBase {
	step: 'confirm-seat-registration';
}

interface NextStepFinishRecruit extends NextStepDataBase {
	step: 'finish-recruit';
	type: 'yes' | 'no';
}

export class RecruitHandler {
	handleRecruitStep(interaction: StringSelectMenuInteraction | Message<boolean> | ButtonInteraction<CacheType> | null, nextStepDataString: string) {
		const nextStep = JSON.parse(nextStepDataString) as NextStepDataBase;

		if (!nextStep) throw Error('Invalid data');
		log.debug(nextStep);

		switch (nextStep.step) {
		case 'create-channel':
			void this.recruitStepCreateChannel(interaction as ButtonInteraction, nextStep as NextStepCreateChannel);
			break;
		case 'start-recruit':
			void this.recruitStepStartRecruit(interaction as ButtonInteraction, nextStep as NextStepStartRecruit);
			break;
		case 'start-enter-main-char':
			void this.recruitStepStartEnterMainChar(interaction as Message, nextStep as NextStepStartEnterMainChar);
			break;
		case 'enter-main-char':
			void this.recruitStepEnterMainChar(interaction as ButtonInteraction, nextStep as NextStepEnterMainChar);
			break;
		case 'seleted-recruit-route':
			void this.recruitStepSelectedRecruitRoute(interaction as StringSelectMenuInteraction, nextStep as NextStepSelectedRecruitRoute);
			break;
		case 'start-agree-infomal':
		case 'start-agree-pvp':
			void this.recruitStepStartAgree(interaction as ButtonInteraction, nextStep as NextStepStartAgree);
			break;
		case 'start-seat-registration':
			void this.recruitStepStartSeatRegistration(interaction as ButtonInteraction, nextStep as NextStepStartSeatRegistration);
			break;
		case 'confirm-seat-registration':
			void this.recruitStepConfirmSeatRegistration(interaction as ButtonInteraction, nextStep as NextStepConfirmSeatRegistration);
			break;
		case 'finish-recruit':
			void this.recruitStepFinishRecruit(interaction as ButtonInteraction, nextStep as NextStepFinishRecruit);
			break;
		}
	}

	isBanTarget(banCharInfo: BanCharInfo) {
		let isBaned = false;
		let banReasonString = '';

		for (const [banReason, banList] of Object.entries(banData)) {
			for (const [banType, names] of Object.entries(banList)) {
				for (const name of names) {
					if (banCharInfo[banType as 'char' | 'corp'] && banCharInfo[banType as 'char' | 'corp'].includes(name)) {
						isBaned = true;
						banReasonString += `${banDataStringMap[banType as 'char' | 'corp']} ${name}은(는) ${banDataStringMap[banReason as 'evegall' | 'evegall_boycott' | 'nisuwaz']} 대상입니다.\n`;
					}
				}
			}
		}

		const reason = `주의! 현재 리크룻 중인 캐릭터 **${banCharInfo.char[0]}**은(는) 밴 리스트에 등재되어 있습니다. 반드시 참고하시고 리크룻 바랍니다.\`\`\`해당 캐릭터가 포함된 밴 리스트는 다음과 같습니다:\n` + banReasonString + '```';
		return { isBaned, reason };
	}

	async getMessageFromContents(channel: TextChannel, contents: string[]) {
		const returnObject: { [key: string]: Message } = {};
		let messageIdPointer: string | null | undefined = 'temp';

		// log.debug(contents);

		while (messageIdPointer) {
			let messagePage;

			if (messageIdPointer === 'temp') {messagePage = await channel.messages.fetch({ limit: 1 });}
			else {messagePage = await channel.messages.fetch({ limit: 100, before: messageIdPointer });}

			for (const msg of messagePage) {
				const recruitStringArrIndex = contents.indexOf(msg[1].content);
				// log.debug(recruitStringArrIndex);

				if (msg[1].author.id == '1091569359794737242' && recruitStringArrIndex !== -1) {
					contents.splice(recruitStringArrIndex, 1);
					returnObject[msg[1].content] = msg[1];
				}

				if (contents.length === 0) {
					return returnObject;
				}
			}

			messageIdPointer = messagePage.size > 0 ? messagePage.lastKey() : null;
		}

		return false;
	}

	/**
	 * 해당 채널에서 해당 메시지가 있는지 확인하고 있으면 true, 없으면 false를 반환합니다.
	 **/
	async isRecruitStepExist(textChannel: TextChannel, response: string) {
		const message = await this.getMessageFromContents(textChannel, [response]);
		if (typeof message === 'object') return true;

		return false;
	}

	/**
	 * 이미 해당하는 채널이 있는지 확인하고 리크룻 / 문의 채널중 선택된 채널을 만든 후 알맞는 메시지를 보냅니다.
	 **/
	async recruitStepCreateChannel(interaction: ButtonInteraction, recruitData: NextStepCreateChannel) {
		const matchingChannels = await interaction.guild?.channels.fetch()
			.then(channels => channels.filter(c => c && c.type === ChannelType.GuildText && c.name.split('-')[0] === interaction.user.tag));

		if (matchingChannels && matchingChannels.size > 0) {
			await interaction.reply({
				content: `이미 전용 채널이 생성되었습니다! 다음 단계를 ${matchingChannels.first()?.toString()} 채널 에서 진행해 주세요.`,
				ephemeral: true,
			});

			return;
		}

		const consultingCategory = interaction.guild?.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '상담중');
		const recruiterRole = interaction.guild?.roles.cache.find(role => role.name == '리크루터');

		if (!consultingCategory || !recruiterRole) throw Error('리크루터 롤 혹은 상담중 카테고리가 존재하지 않습니다.');

		const consultingChannel = await (consultingCategory as CategoryChannel).children.create({
			name: interaction.user.tag + '-' + recruitStepData[recruitData.step][recruitData.type].type,
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

		const response = {
			content: `**${interaction.user.tag}` + recruitStepData[recruitData.step][recruitData.type].response,
			components: recruitStepData[recruitData.step][recruitData.type].row,
		};

		await consultingChannel.send(response);
		await interaction.reply({
			content: `전용 채널이 생성되었습니다! 다음 절차를 ${consultingChannel.toString()} 채널 에서 진행해 주세요.`,
			ephemeral: true,
		});
	}

	/**
	 * recruitStepCreateChannel 다음 단계. 숙지해야 할 사항을 보냅니다.
	 **/
	async recruitStepStartRecruit(interaction: ButtonInteraction, recruitData: NextStepStartRecruit) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step][recruitData.type].response);
		if (passedThisStep) {
			await interaction.reply('이미 꼽을 선택하셨습니다. 다음 절차를 진행해 주세요. \n혹시 잘못 선택하셨다면 리크루터에게 문의해 주세요.');
			return;
		}

		await (interaction.channel as TextChannel).setName((interaction.channel as TextChannel).name + `-${recruitData.type}`);
		await interaction.reply(recruitStepData[recruitData.step][recruitData.type].response);
	}

	/**
	 * recruitStepStartRecruit 다음 단계. 메인 캐릭터 입력 받는 버튼을 보냅니다.
	 **/
	async recruitStepStartEnterMainChar(message: Message, recruitData: NextStepStartEnterMainChar) {
		const passedThisStep = await this.isRecruitStepExist(message.channel as TextChannel, recruitStepData[recruitData.step].content);
		if (passedThisStep) {
			await message.channel.send('이미 조건을 숙지하셨습니다. 다음 절차를 진행해 주세요.');
			return;
		}

		await message.channel.send({
			content: recruitStepData[recruitData.step].content,
			components: recruitStepData[recruitData.step].row,
		});
	}

	/**
	 * recruitStepStartEnterMainChar 다음 단계. '메인 캐릭터 입력' 버튼 클릭을 받아 메인 캐릭터 입력 Modal을 보내고 입력을 받습니다.
	 **/
	async recruitStepEnterMainChar(interaction: ButtonInteraction, recruitData: NextStepEnterMainChar) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step].response);
		if (passedThisStep) {
			await interaction.reply('이미 메인 캐릭터를 확인했습니다. 다음 절차를 진행해 주세요. \n혹시 잘못 입력하셨다면 리크루터에게 문의해 주세요.');
			return;
		}

		await interaction.showModal(recruitStepData[recruitData.step].modal);
		const submitted = await interaction.awaitModalSubmit({
			// timeout (120sec)
			time: 120000,
			filter: i => i.user.id === interaction.user.id,
		}).catch(() => {
			// TODO: 오류가 Timeout일 경우 입력 시간을 초과했다고 알림
			return;
		});

		if (submitted) {
			await submitted.deferReply();

			const mainCharacterName = submitted.fields.getTextInputValue('mainCharNameInput').trim();
			// TODO : 이름에 대한 유효성 검사 추가

			const esiRequest = new EsiRequester();
			const mainCharacterIds = await esiRequest.getIdsFromNames([mainCharacterName]);

			const mainCharacterId = mainCharacterIds.characters?.[0].id.toString() as string;
			const mainCharacterCorpHistory = await esiRequest.getCorpHistoryFromCharId(mainCharacterId);
			const corpNames = await esiRequest.getNamesFromIds([...new Set(mainCharacterCorpHistory.map(entry => entry.corporation_id))]);
			const corpIdToNameMap = new Map(corpNames.map(corp => [corp.id, corp.name]));
			const corpHistory = mainCharacterCorpHistory.map((obj, index) => {
				const startDate = obj.start_date.split('T')[0];
				const corporationName = corpIdToNameMap.get(obj.corporation_id);
				const previousEndDate = index > 0 ? mainCharacterCorpHistory[index - 1].start_date.split('T')[0] : null;

				return `${startDate}~${previousEndDate || ''} ${corporationName}`;
			}).join('\n');

			const charInfoByType = {
				char: [mainCharacterName],
				corp: corpNames.map(corporation => corporation.name),
			};

			// TODO: add alliance ban filter

			const recruiterRole = submitted.guild?.roles.cache.find(role => role.name == '리크루터');
			const { isBaned, reason } = this.isBanTarget(charInfoByType);
			const workingChannel = submitted.guild?.channels.cache.find(channel => channel.name === '리크루터-working') as TextChannel;

			if (!recruiterRole) throw Error('리크루터 롤이 존재하지 않습니다.');
			if (!workingChannel) throw Error('리크루터 채널이 존재하지 않습니다.');

			if (isBaned) {
				await workingChannel.send(`<@&${recruiterRole.id}> ` + reason);
			}

			const charInfoEmbed = new EmbedBuilder()
				.setTitle(mainCharacterName + ' : ' + mainCharacterId)
				.setThumbnail(`https://images.evetech.net/characters/${mainCharacterId}/portrait?size=128`)
				.setDescription('```' + corpHistory + '```');

			await submitted.editReply({
				content: recruitStepData[recruitData.step].response,
				embeds: [charInfoEmbed],
				components: [recruitStepData[recruitData.step].row],
			});
		}
	}

	/**
	 * recruitStepEnterMainChar 다음 단계. 리크룻 경로 선택 입력을 받고 기타 선택시 기타 경로 입력 폼을 보냅니다.
	 **/
	async recruitStepSelectedRecruitRoute(interaction: StringSelectMenuInteraction, recruitData: NextStepSelectedRecruitRoute) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step].response);
		if (passedThisStep) {
			await interaction.reply('이미 리크룻 경로를 선택하셨습니다. 다음 절차를 진행해 주세요. \n혹시 잘못 선택하셨다면 리크루터에게 문의해 주세요.');
			return;
		}

		const selectedRecruitRoute = interaction.values[0];
		let result;
		let resultingInteraction: StringSelectMenuInteraction | ModalSubmitInteraction = interaction;

		if (selectedRecruitRoute == '기타') {
			await interaction.showModal(recruitStepData[recruitData.step].modal);

			const submitted = await interaction.awaitModalSubmit({
				// timeout (120sec)
				time: 120000,
				filter: i => i.user.id === interaction.user.id,
			}).catch(error => {
				console.log(error);
				return;
			});

			if (submitted) {
				result = submitted.fields.getTextInputValue('recruitRouteEtcInput');
				resultingInteraction = submitted;
			}
			else {return;};
		}

		if (result) {
			result = '\n상세 정보: ' + result;
		}
		else {
			result = '';
		}
		const recruitRouteEmbed = new EmbedBuilder()
			.setDescription('```' + '경로: ' + selectedRecruitRoute + result + '```');

		await resultingInteraction.reply({
			content: recruitStepData[recruitData.step].response,
			embeds: [recruitRouteEmbed],
			components: [recruitStepData[recruitData.step].row],
		});
	}

	/**
	 * recruitStepSelectedRecruitRoute 다음 단계. 동의 버튼을 보냅니다.
	 **/
	async recruitStepStartAgree(interaction: ButtonInteraction, recruitData: NextStepStartAgree) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step].response);
		if (passedThisStep) {
			await interaction.reply(recruitStepData[recruitData.step].responseAgain);
			return;
		}

		const type = (interaction.channel as TextChannel).name.split('-')[2] as 'nisuwaz' | 'consui';

		await interaction.reply({
			content: recruitStepData[recruitData.step].response,
			// this is actually safe.
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			components: [recruitStepData[recruitData.step][type].row],
		});
	}

	/**
	 * recruitStepStartAgree 다음 단계. 동의 버튼 클릭을 받고 시트 가입 확인 폼을 보냅니다.
	 **/
	async recruitStepStartSeatRegistration(interaction: ButtonInteraction, recruitData: NextStepStartSeatRegistration) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step].response);
		if (passedThisStep) {
			await interaction.reply('이미 모든 동의를 완료하셨습니다. 다음 절차를 진행하여 주세요.');
			return;
		}

		await interaction.reply({
			content: recruitStepData[recruitData.step].response,
			components: [recruitStepData[recruitData.step].row],
		});
	}

	/**
	 * recruitStepStartSeatRegistration 다음 단계. 동의 버튼 클릭을 받고 시트 가입을 확인한 후 리크룻을 마칩니다.
	 **/
	async recruitStepConfirmSeatRegistration(interaction: ButtonInteraction, recruitData: NextStepConfirmSeatRegistration) {
		const passedThisStep = await this.isRecruitStepExist(interaction.channel as TextChannel, recruitStepData[recruitData.step].response);
		if (passedThisStep) {
			await interaction.reply('이미 가입 절차를 완료하셨습니다.');
			return;
		}

		await interaction.deferReply();

		const recruitSummary = await this.getMessageFromContents(interaction.channel as TextChannel, [recruitStepData['seleted-recruit-route'].response, recruitStepData['enter-main-char'].response]) as { [key: string]: Message };
		const [maincharName, maincharId] = recruitSummary[recruitStepData['enter-main-char'].response].embeds[0].data.title?.split(':').map(item => item.trim()) ?? [undefined, undefined];

		log.debug (`${maincharName} ${maincharId}`);

		if (!maincharName || !maincharId) throw Error('캐릭터 정보를 불러올 수 없습니다.');

		const seatRequester = new SeatRequester();
		try {
			await seatRequester.getCharacterSheetFromId(maincharId);
		}
		catch (error) {
			await interaction.editReply('시트 가입 인증에 실패했습니다. 10 ~ 30분 후 다시 시도해 주세요. \n만약 계속 실패한다면 리크루터에게 문의해 주세요.');
		}

		const recruitRouteString = recruitSummary[recruitStepData['seleted-recruit-route'].response]?.embeds[0]?.data?.description?.replace('\n', ', ')?.replace('```', '')?.replace('```', '') ?? '';

		await interaction.editReply(recruitStepData[recruitData.step].response);

		const recruiterRole = interaction.guild?.roles.cache.find(role => role.name == '리크루터');
		if (!recruiterRole) throw Error('리크루터 롤이 존재하지 않습니다.');

		const recruitDetailString = `<@&${recruiterRole.id}>` + '\n```가입 정보:\n\n' +
		    `가입 캐릭터 명: ${maincharName}\n` +
		    `가입 ${recruitRouteString}` + '```';

		const seatLink = new ButtonBuilder()
			.setLabel('SeAT 정보')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://seat.nisuwaz.com/characters/${maincharId}/sheet`);

		const evewhoLink = new ButtonBuilder()
			.setLabel('EveWho 정보')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://evewho.com/character/${maincharId}`);

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(seatLink, evewhoLink);

		await interaction.channel?.send({
			content: recruitDetailString,
			components: [row],
		});
	}

	/**
	 * recruitStepStartSeatRegistration 다음 단계. 동의 버튼 클릭을 받고 시트 가입을 확인한 후 리크룻을 마칩니다.
	 **/
	async recruitStepFinishRecruit(interaction: ButtonInteraction, recruitData: NextStepFinishRecruit) {
		if (recruitData.type === 'no') {
			// 취소
			await interaction.update({ content: '상담 완료 명령이 취소되었습니다.', components: [] });
			return;
		}

		await interaction.update({ content: '상담 완료 명령을 처리 중입니다...', components: [] });
		const today = new Date();

		const year = today.getFullYear();
		const month = ('0' + (today.getMonth() + 1)).slice(-2);
		const day = ('0' + today.getDate()).slice(-2);

		const targetCategories = interaction.guild?.channels.cache.filter(c => c.type === ChannelType.GuildCategory && c.name === '상담완료');

		const channel = interaction.channel as TextChannel;
		if (targetCategories?.size !== 1) {
			await interaction.editReply('상담완료 카테고리가 존재하지 않거나 너무 많습니다.');
			return;
		}

		await channel.setParent((targetCategories.entries().next().value as [string, CategoryChannel])[1]);
		await channel.setName(channel.name + '_' + year + '-' + month + '-' + day);
		await channel.lockPermissions();
		await channel.send(`${interaction.member?.toString()}님이 상담완료 명령을 사용하여 이 채널을 완료 처리 하였습니다.`);
	}
}