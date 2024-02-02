async function checkRecruitStage(channel, recruitString) {
    // Create message pointer
    let message = await channel.messages
    .fetch({ limit: 1 })
    .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
    // 만약 첫번째 항목이 찾는 항목일 경우 즉시 리턴
    if (message.content == recruitString) return [false, message];

    while (message) {
        const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });

        for (const msg of messagePage) {
            //console.log(msg[1].content);
            if (msg[1].author.id == 1091569359794737242 && msg[1].content == recruitString) {
                return [false, msg[1]];
            }
        }

        // Update our message pointer to be the last message on the page of messages
        message = messagePage.size > 0 ? messagePage.at(messagePage.size - 1) : null;
    }

    return [true];
}

async function getRecruitInfo(channel, recruitStringArr) {
    let returnObject = {};

    // Create message pointer
    let message = await channel.messages
    .fetch({ limit: 1 })
    .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

    while (message) {
        const messagePage = await channel.messages.fetch({ limit: 100, before: message.id });

        for (const msg of messagePage) {
            const recruitStringArrIndex = recruitStringArr.indexOf(msg[1].content);

            if (msg[1].author.id == 1091569359794737242 && recruitStringArrIndex !== -1) {
                recruitStringArr.splice(recruitStringArrIndex, 1);
                returnObject[msg[1].content] = msg[1];
            }

            if (recruitStringArr.length === 0)
                return returnObject;
        }

        // Update our message pointer to be the last message on the page of messages
        message = messagePage.size > 0 ? messagePage.at(messagePage.size - 1) : null;
    }
}

function makeMessageLink(message) {
    return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
}

function isBanTarget(charInfoByType, recruiterRoleID) {
    const {banData, banDataStringMapping} = require('./data.js');

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

    return [returnBoolean, returnString+'```'];
}

// Export the function
module.exports = { checkRecruitStage, makeMessageLink, getRecruitInfo, isBanTarget };