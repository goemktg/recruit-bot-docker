const { Events, ChannelType, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { checkRecruitStage, getRecruitInfo, isBanTarget, makeMessageLink } = require('../library/functions.js')

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
        const ConfirmStringMainchar = '메인 계정이 확인되었습니다. 아래 정보가 맞는지 확인하시고, 그 아래 박스에서 리크룻 경로를 선택해 주세요.';
        const confirmStringRoute = "리크룻 경로가 다음과 같이 선택되었습니다:";
        const recruiterRoleID = '1200771439511482398';

        if (interaction.isButton()) {
            //
            // 상담 채널 생성
            //
            if (interaction.customId == 'startRecruit' || interaction.customId == 'startConv') {
                // 이미 상담 채널이 있는지 확인
                const tempChannels = await interaction.guild.channels.fetch()
                    .then(channels => channels.filter(c => c.type === 0 &&  c.name.split('-')[0] === interaction.user.tag));
            
                //console.log(tempChannels.entries().next().value[1]);
    
                if (tempChannels.size) {
                    await interaction.reply({
                        content: `이미 전용 채널이 생성되었습니다! 다음 단계를 ${tempChannels.entries().next().value[1]} 채널 에서 진행해 주세요.`,
			            ephemeral: true,
                    });
    
                    return;
                }
            
                const consultingCategory = interaction.client.channels.cache.find(c => c.type === 4 &&  c.name === '상담중');
            
                var responseType = ''
                if (interaction.customId == 'startRecruit') responseType = '리크룻'
                if (interaction.customId == 'startConv') responseType = '문의'
            
                const consultingChannel = await consultingCategory.children.create({
                    name: interaction.user.tag+"-"+responseType,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: recruiterRoleID,
                        },
                    ]
                })
            
                await interaction.reply({
                    content: `디스코드에 전용 채널 ${consultingChannel}이(가) 생성되었습니다! 해당 채널에서 진행해 주세요.`,
                    ephemeral: true,
                });
                
                var responseMsg = '';
                
                if (interaction.customId == 'startRecruit') responseMsg =
                `**${interaction.user.tag}**님 어서오세요! `+"저희 Nisuwaz는 로우 시큐리티 PvP 콥으로써 __**다음 내용을 충분히 숙지**__하시고 가입해주시기 바랍니다. 봇을 통한 자동 가입 절차를 모두 완료하시면 리크루터가 자동으로 호출됩니다. 가입 도중 질문이 있으시다면 언제든 `@리크루터`를 입력하여 리크루터를 호출하시면 됩니다.\n\n\n"
                +"1. Nisuwaz는 로섹 PvP콥으로, 지속적인 PvP 활동으로 인해 시큐리티가 하락하여 하이섹 통행에 불편함이 생김에 따라서 저희 콥에서는 하이섹 통행을 금지하고 있습니다. 대신 스테이징 성계인 니수와 <=> 지타간 자체 운송 시스템이 있습니다.\n\n"
                +"2. 개인별 시큐리티는 PvP하면서 어쩔 수 없이 떨어지게 되어있으며 다시 올릴 수 있는 방법이 여러가지가 있으니 크게 문제되는 부분은 아닙니다.\n\n"
                +"3. 또한 일이 있어도 블루는 공격하면 안됩니다. 블루에게 공격받았을 경우 스크린샷을 찍지 않고 반격하여 상대를 죽였을 경우, 증거가 없기 때문에 오히려 잘못을 뒤집어쓸 가능성이 있습니다. 블루에게 공격받았을 경우 스크린샷을 찍고 리더쉽에게 제출하여 상황을 설명해주셔야 합니다.\n\n"
                +"4. 저희 Nisuwaz는 오메가 계정만 가입을 받고 있습니다. 알파 계정은 바로 오메가를 결제할 예정일 경우에만 가입상담 가능합니다.\n\n"
                +"위의 사항에 모두 동의하며 숙지하셨다면 아래에 `/조건숙지함`이라는 글자를 입력하여 다음 절차를 진행하실 수 있습니다.";
            
                if (interaction.customId == 'startConv') responseMsg =
                "문의 채널이 개설되었습니다. 해당 채널은 Nisuwaz 리더쉽과 리크루터들만 볼 수 있습니다. 오직 리더쉽만 봐야 하는 내용이라면 해당 디스코드 인원 중 `goem_`에게 디스코드 dm 혹은 인게임 `Esiz AL`, `RI YURI`, `Goem Funaila` 중 하나 혹은 모두에게 인게임 메일로 보내주세요."
            
                await consultingChannel.send(responseMsg);
            }
            //
            // 메인 캐릭터 확인, 유입 경로 시작
            //
            else if (interaction.customId == 'startInputName') {
                const isPassed = await checkRecruitStage(interaction.channel, ConfirmStringMainchar);
                if (!isPassed[0]) {
                    await interaction.reply(`이미 메인 캐릭터를 확인했습니다. 다음 단계를 ${makeMessageLink(isPassed[1])} 해당 메시지의 선택 메뉴를 통해 진행해 주세요.`);
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

                    const maincharName = submitted.fields.getTextInputValue('maincharnameInput').trim();
                    
                    const charnamePostData = [maincharName];

                    const maincharId = await axios.post('https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en', charnamePostData)
                        .then((response) => response.data.characters[0].id);
                    
                    const maincharHistory = await axios.get(`https://esi.evetech.net/latest/characters/${maincharId}/corporationhistory/?datasource=tranquility`)
                        .then((response) => response.data);

                    const corpnamePostData = [...new Set(maincharHistory.map(entry => entry.corporation_id))];
                    const corpNames = await axios.post('https://esi.evetech.net/latest/universe/names/?datasource=tranquility&language=en', corpnamePostData)
                        .then((response) => response.data);

                    const corpIdToNameMap = new Map(corpNames.map(item => [item.id, item.name]));

                    const corpHistory = maincharHistory.map((obj, index) => {
                        // 시간 잘라내고 날짜만 사용
                        const startDate = obj.start_date.split('T')[0];
                        // map 이용해 name 가져오기
                        const corporationName = corpIdToNameMap.get(obj.corporation_id);

                        // 첫번째 값이 아니면 그 전 레코드의 값 가져오기
                        const previousEndDate = index > 0 ? maincharHistory[index - 1].start_date.split('T')[0] : null;

                        return `${startDate}~${previousEndDate || ''} ${corporationName}`;
                    }).join('\n');

                    const charInfoEmbed = new EmbedBuilder()
                        .setTitle(maincharName + " : " + maincharId)
                        .setThumbnail(`https://images.evetech.net/characters/${maincharId}/portrait?size=128`)
                        .setDescription("```"+corpHistory+"```")

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
                                .setValue('기타')
                        )
                    
                    const row = new ActionRowBuilder()
                            .addComponents(recruitRouteSelectMenu);

                    await submitted.editReply({
                        content: ConfirmStringMainchar,
                        embeds: [charInfoEmbed],
                        components: [row],
                    });

                    const charInfoByType = {
                        'char': [maincharName],
                        'corp': corpNames.map(corporation => corporation.name),
                    };

                    const [isBan, reason] = isBanTarget(charInfoByType, recruiterRoleID);

                    let channel = submitted.guild.channels.cache.find(channel => channel.name === '리크루터-working');
                    if (isBan)
                        await channel.send(reason);
                }
            }
            //
            // 반말 동의 확인, PVP 동의 시작
            //
            else if (interaction.customId == 'agreeInformal') {
                const confirmString = '반말 동의를 확인했습니다.\n\n저희 코퍼레이션은 기본적으로 PvP 지향 코퍼레이션으로, 최소한의 PvP활동을 하셔야 합니다. 동의하시면 하단 버튼을 눌러주세요.';
                const isPassed = await checkRecruitStage(interaction.channel, confirmString);
                if (!isPassed[0]) {
                    await interaction.reply(`이미 반말 동의를 확인했습니다. 다음 단계를 ${makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
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
            // PVP 동의 확인, SeAT 등록 시작
            //
            else if (interaction.customId == 'agreePVP') {
                const confirmString = 'PVP 동의를 확인했습니다.\n\n아래 \'SeAT\' 버튼을 눌러 웹사이트를 방문하여 이브온라인 계정으로 로그인한 뒤, 메인 캐릭터를 등록하고 \'등록 완료\'버튼을 눌러주세요. 스파이 방지 등을 위해 필요한 절차입니다.\n**API의 한계로 정보를 받아오는 데 10~30분 정도의 시간이 걸립니다.** 그 동안 혹시 알트가 있으시다면 아래 \'가이드\' 버튼을 눌러 나오는 사이트를 참고하여 알트를 추가해 주세요.';
                const isPassed = await checkRecruitStage(interaction.channel, confirmString);
                if (!isPassed[0]) {
                    await interaction.reply(`이미 PVP 동의를 확인했습니다. 다음 단계를 ${makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
                    return;
                }

                const registrationEnd = new ButtonBuilder()
                    .setCustomId('registrationEnd')
                    .setLabel('등록 완료')
                    .setStyle(ButtonStyle.Success);
                
                const seatLink = new ButtonBuilder()
                    .setLabel('SeAT')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://seat.gopw.kr/");

                const guideLink = new ButtonBuilder()
                    .setLabel('가이드')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://forums.gopw.kr/t/seat/224")
    
                const row = new ActionRowBuilder()
                    .addComponents(registrationEnd, seatLink, guideLink);

                await interaction.reply({
                    content: confirmString,
                    components: [row],
                });
            }
            //
            // 등록 완료 확인
            //
            else if (interaction.customId == 'registrationEnd') {
                const confirmString = "SeAT 가입이 인증되었습니다. 리크루터를 호출합니다.";
                const isPassed = await checkRecruitStage(interaction.channel, confirmString);
                if (!isPassed[0]) {
                    await interaction.reply(`이미 모든 절차를 마쳤습니다. 리크루터와의 상담 부탁드립니다.`);
                    return;
                }

                await interaction.deferReply();

                const headers = {
                    'accept': 'application/json',
                    'X-TOKEN': process.env.SEAT_TOKEN
                };

                // const maincharData = (await checkRecruitStage(interaction.channel, ConfirmStringMainchar))[1];
                const recruitData = await getRecruitInfo(interaction.channel, [ConfirmStringMainchar, confirmStringRoute]);

                const [maincharName, maincharId] = recruitData[ConfirmStringMainchar].embeds[0].data.title.split(':').map(item => item.trim());

                console.log(recruitData[ConfirmStringMainchar].embeds[0].data.title.split(':').map(item => item.trim()));

                const seatData = await axios.get("https://seat.gopw.kr/api/v2/character/sheet/"+maincharId, { headers });

                if (await seatData.status != 200 || await seatData.statusText != "OK")
                    await interaction.editReply('시트 인증에 실패했습니다. 10 ~ 30분 후 다시 시도해 주세요.');
                else
                {
                    const recruitRouteString = recruitData[confirmStringRoute].embeds[0].data.description.replace('\n', ', ').replace('```', '').replace('```', '');

                    await interaction.editReply(confirmString);
                    
                    const recruitDetailString = `<@&${recruiterRoleID}>`+'\n```가입 정보:\n\n'+
                    `가입 캐릭터 명: ${maincharName}\n`+
                    `가입 ${recruitRouteString}\n`+
                    `반말, PVP 동의`+'```';

                    const seatLink = new ButtonBuilder()
                        .setLabel('SeAT 정보')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://seat.gopw.kr/characters/${maincharId}/sheet`);

                    const evewhoLink = new ButtonBuilder()
                        .setLabel('EveWho 정보')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://evewho.com/character/${maincharId}`)
        
                    const row = new ActionRowBuilder()
                        .addComponents(seatLink, evewhoLink);

                    await interaction.channel.send({
                        content: recruitDetailString,
                        components: [row],
                    });
                }
            }
        }
        //
        // 유입 경로 확인, 반말 동의 시작
        //
        else if (interaction.isStringSelectMenu()) {
            const isPassed = await checkRecruitStage(interaction.channel, confirmStringRoute);
                if (!isPassed[0]) {
                    await interaction.reply(`이미 리크룻 경로를 선택했습니다. 다음 단계를 ${makeMessageLink(isPassed[1])} 해당 메시지에서 진행해 주세요.`);
                    return;
                }

            const selectedRecruitRoute = interaction.values[0];
            var result;
            
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

            if (result)
                result = '\n상세 정보: '+result;
            else
                result = '';
            const recruitRouteEmbed = new EmbedBuilder()
                .setDescription('```'+'경로: '+selectedRecruitRoute+result+'```');

            const agreeInformal = new ButtonBuilder()
                .setCustomId('agreeInformal')
                .setLabel('반말 동의함')
                .setStyle(ButtonStyle.Success);
    
            const row = new ActionRowBuilder()
                .addComponents(agreeInformal);

            await interaction.reply({
                content: confirmStringRoute,
                embeds: [recruitRouteEmbed],
            });

            await interaction.followUp({
                content: "저희 코퍼레이션은 기본적으로 반말을 허용하고 있습니다. 동의하시면 아래 버튼을 눌러주세요.",
                components: [row],
            })
        }
	},
};