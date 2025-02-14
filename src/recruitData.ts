import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle,
} from "discord.js";

export const banData = {
  evegall: {
    char: [
      "072 kong",
      "072 kong-ja",
      "3vent Horizon",
      "Ahri Redfox",
      "Aajer Ci",
      "Al-Bak-Lee",
      "Alizee Virgin",
      "Alkira B",
      "Antonio Dinolfo",
      "Arak Qao",
      "Arms Trader",
      "Artanis Lee",
      "Arya Slark",
      "Ash Grayhorn",
      "AWPerfect -DC",
      "Barosca",
      "BisangGu",
      "BisangGu 3",
      "BisangGu Hita",
      "BisangGu4",
      "Blanka LaSorcistino",
      "BLESSED NAME",
      "Blythe Barrymore",
      "bulletmusic",
      "bulletpunch",
      "bulletspeed",
      "Ceia Visteen",
      "Clor2",
      "Cochineal Carotinoid",
      "Ctrl Ctrill",
      "Dang ding",
      "dltmdgkr1",
      "Down Drop",
      "Enfold Heleneto",
      "eric0135 Arkaral",
      "Estel Mythchoi",
      "evedead Antollare",
      "firefly Shy",
      "firefly Wind",
      "Flower Fallen",
      "Gallente Citizen 246911908",
      "GrimaGOON",
      "Guyner Kashnap",
      "Halphas Arthie",
      "Head Hunter Sentinal",
      "hellbard Ch",
      "Heurin bada",
      "Heyzo",
      "HG Captain",
      "Hong Zanjoahir",
      "Jin Fehrnah",
      "jinho yeom",
      "JOHN CENA IDIOT",
      "kabin hiness",
      "Karakoo",
      "Karapub",
      "khaki klein",
      "Kiranes",
      "KOCAINE CONNECT",
      "kyu-ho jun",
      "Leblanc Stein",
      "Leffe Brown",
      "Liberal Sparrow",
      "LiEel Afuran",
      "Lightgazer Aihaken",
      "Lilis Skyremix",
      "Lonely Christmas",
      "Luv Star",
      "LYGIA",
      "Mecatama Mk2",
      "Mei Ji Yang",
      "Mellan Gior",
      "Ministo Meteorito",
      "Mister Plate",
      "Mister Platee",
      "Mister Plates",
      "naur tirednaur",
      "Neia Ghosthazard",
      "Neria Kashnap",
      "Oral B Siesta",
      "Oscar Menalque",
      "Paowuuka",
      "Pectus Solentis",
      "poiup",
      "ray sang",
      "Rin Leo",
      "romi da",
      "S Nidor",
      "Sakura Chiyo",
      "Sandra Duke",
      "Saya Len",
      "Sellesti Klein",
      "Seowon Jung",
      "seryuyo Kagura",
      "Sexy Bomb",
      "Shiori Snow",
      "Skillplan Test",
      "Sohpie Vista",
      "Sonora Min",
      "Sword Breaker SKY",
      "syub95",
      "Tab Tablet",
      "Twizzlespark",
      "Twizzlespark Celes",
      "VengeanceMK2",
      "vfbank86",
      "whatwhat theHell",
      "Wicked Capital",
      "Young9",
      "zeratul Lee",
    ],
    corp: [
      "9th Division",
      "072 kong Corporation",
      "AOJI Colliery",
      "Black Parrot",
      "CLOUD TEMPLE",
      "COK",
      "DANGERCLOSE ARTILLERY",
      "Enterprise DoubleK Corporation",
      "Full-Moon Corporation",
      "Godspeed to us all",
      "Golden Family",
      "Helper Sisters Of EVE",
      "JustSayNo2Taxes",
      "KingDom of The Wind",
      "Luv is taken Down",
      "Macabre Votum",
      "Make Some Money.",
      "Manami Crazy Newbie",
      "Manami Logics Inter Corporation",
      "MIRINAE.",
      "MoonRabbit Collective",
      "MoonRabbit Council",
      "Moving Star",
      "NullSsay",
      "Prima Stella",
      "Republic of Korea SWORD.Corporation",
      "Return Of The King",
      "Sword Breaker SKY Corporation",
      "Takealook.",
      "Twizzlespark Inc.",
      "Visteen Social Welfare Cooperation Project",
      "W.I.M Inc.",
    ],
    alli: ["DSIM"],
  },
  evegall_boycott: {
    char: ["Arablo", "roby sang", "DancingOnTheMoon"],
    corp: [
      "A green bird",
      "AMC.",
      "AMC.HD",
      "AMC.WHD",
      "Kill Mail Delivery",
      "Night Fog Fleet",
    ],
  },
  nisuwaz: {
    char: [
      "Noh Jinho",
      "Kahi Nari",
      "RNZAF",
      "RNZAF-04",
      "RNZAF-2",
      "RNZAF-G",
      "RNZAF-M",
      "RNZAF-M2",
      "ROKNM",
      "Sigourney Cleaver",
    ],
  },
};

export const banDataStringMap = {
  evegall: "입갤 밴",
  evegall_boycott: "입갤 새컨더리 보이콧",
  nisuwaz: "니수와 - 소맥/소주 밴",
  corp: "코퍼레이션",
  char: "캐릭터",
};

export const recruitStepData = {
  "create-channel": {
    recruit: {
      type: "리크룻",
      response:
        "**님 Nisuwaz / Corn Soup. Industrial 공용 리크룻 채널에 오신 것을 환영합니다! \n아래의 간단한 꼽 설명을 읽고, 가입을 원하시는 꼽에 해당하는 버튼을 눌러주세요. 궁금한 점이 있다면 언제든지 @리크루터 로 리크루터를 호출할 수 있습니다. \n* Corn Soup. Industrial: 대충 설명 \n* Nisuwaz: 로우 시큐리티 PvP 콥으로 자신이 PvE 활동 보다는 PvP 활동을 하고 싶을 때 알맞습니다.",
      row: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('{"step":"start-recruit","type":"nisuwaz"}')
            .setLabel("니수와즈 리크룻 시작")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('{"step":"start-recruit","type":"consui"}')
            .setLabel("콘스프 리크룻 시작")
            .setStyle(ButtonStyle.Primary),
        ),
      ],
    },
    conv: {
      type: "문의",
      response:
        "**님을 위한 문의 채널이 개설되었습니다. 해당 채널은 Nisuwaz 리더쉽과 리크루터들만 볼 수 있습니다. 오직 리더쉽만 봐야 하는 내용이라면 해당 디스코드 인원 중 `goem_`, `esiz` 에게 디스코드 dm 혹은 인게임 `Esiz AL`, `RI YURI`, `Goem Funaila` 중 하나 혹은 모두에게 인게임 메일로 보내주세요.",
      row: [],
    },
  },
  "start-recruit": {
    nisuwaz: {
      response:
        "저희 Nisuwaz는 로우 시큐리티 PvP 콥으로써 __**다음 내용을 충분히 숙지**__하시고 가입해주시기 바랍니다. 봇을 통한 자동 가입 절차를 모두 완료하시면 리크루터가 자동으로 호출됩니다. 가입 도중 질문이 있으시다면 언제든 `@리크루터`를 입력하여 리크루터를 호출하시면 됩니다.\n\n1. Nisuwaz는 로섹 PvP콥으로, 지속적인 PvP 활동으로 인해 시큐리티가 하락하여 하이섹 통행에 불편함이 생길 수 있습니다. 대신 스테이징 성계인 니수와 <=> 지타간 자체 운송 시스템이 있습니다.\n\n2. 개인별 시큐리티는 PvP하면서 어쩔 수 없이 떨어지게 되어있으며 다시 올릴 수 있는 방법이 여러가지가 있으니 크게 문제되는 부분은 아닙니다.\n\n3. 또한 일이 있어도 블루는 공격하면 안됩니다. 블루에게 공격받았을 경우 스크린샷을 찍지 않고 반격하여 상대를 죽였을 경우, 증거가 없기 때문에 오히려 잘못을 뒤집어쓸 가능성이 있습니다. 블루에게 공격받았을 경우 스크린샷을 찍고 리더쉽에게 제출하여 상황을 설명해주셔야 합니다.\n\n4. 저희 Nisuwaz는 오메가 계정만 가입을 받고 있습니다. 알파 계정은 바로 오메가를 결제할 예정일 경우에만 가입상담 가능합니다. \n\n위의 사항에 모두 동의하며 숙지하셨다면 아래에 `/조건숙지함`이라는 글자를 입력하여 다음 절차를 진행하실 수 있습니다.",
    },
    consui: {
      response: "저희 Corn Soup. Industrial은 대충 설명",
    },
  },
  "start-enter-main-char": {
    content:
      "조건 숙지를 확인했습니다. 다음으로 하단 버튼을 눌러 나오는 메뉴에서 자신의 **메인 캐릭터 명**을 입력해 주세요.",
    row: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('{"step":"enter-main-char"}')
          .setLabel("입력하기")
          .setStyle(ButtonStyle.Primary),
      ),
    ],
  },
  "enter-main-char": {
    response:
      "메인 계정이 확인되었습니다. 아래 정보가 맞는지 확인하시고, 그 아래 박스에서 리크룻 경로를 선택해 주세요.",
    modal: new ModalBuilder()
      .setCustomId("inputNameModal")
      .setTitle("메인 캐릭터 이름 입력")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setMinLength(3)
            .setMaxLength(37)
            .setCustomId("mainCharNameInput")
            .setLabel("메인 캐릭터의 이름을 입력하여 주십시오.")
            .setPlaceholder("예시) Goem Funaila")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      ),
    row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('{"step":"seleted-recruit-route"}')
        .setPlaceholder("리크룻 경로를 선택해 주세요!")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("DC인사이드 이브 온라인 갤러리 리크룻 광고글")
            .setValue("DC인사이드 이브 온라인 갤러리 리크룻 광고글"),
          new StringSelectMenuOptionBuilder()
            .setLabel("네이버 카페 리크룻 광고글")
            .setValue("네이버 카페 리크룻 광고글"),
          new StringSelectMenuOptionBuilder()
            .setLabel("지인 추천")
            .setValue("지인 추천"),
          new StringSelectMenuOptionBuilder()
            .setLabel("리크루터 직접 리크룻")
            .setValue("리크루터 직접 리크룻"),
          new StringSelectMenuOptionBuilder().setLabel("기타").setValue("기타"),
        ),
    ),
  },
  "seleted-recruit-route": {
    modal: new ModalBuilder()
      .setCustomId("inputRecruitRouteETC")
      .setTitle("기타 리크룻 경로 세부 사항 입력")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("recruitRouteEtcInput")
            .setLabel("기타 경로의 세부 사항을 입력해 주세요.")
            .setPlaceholder("예시) 지인은 아니지만 xx에게 추천받아 가입")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      ),
    response: "리크룻 경로가 다음과 같이 선택되었습니다:",
    row: new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('{"step":"start-agree-infomal"}')
        .setLabel("선택된 경로 확인")
        .setStyle(ButtonStyle.Success),
    ),
  },
  "start-agree-infomal": {
    response:
      "저희 코퍼레이션은 기본적으로 반말을 허용하고 있으나, 원하시면 존대도 사용 가능합니다. 동의하시면 아래 버튼을 눌러주세요.",
    responseAgain:
      "이미 경로를 확인하셨습니다. 다음 절차를 진행해 주세요.\n혹시 잘못 선택하셨다면 리크루터에게 문의해 주세요.",
    nisuwaz: {
      row: new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('{"step":"start-agree-pvp"}')
          .setLabel("동의합니다")
          .setEmoji({ name: "✅" })
          .setStyle(ButtonStyle.Success),
      ),
    },
    consui: {
      row: new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('{"step":"start-seat-registration"}')
          .setLabel("동의합니다")
          .setEmoji({ name: "✅" })
          .setStyle(ButtonStyle.Success),
      ),
    },
  },
  "start-agree-pvp": {
    response:
      "반말 동의를 확인했습니다.\n\n저희 코퍼레이션은 기본적으로 PvP 지향 코퍼레이션으로, 최소한의 PvP활동을 하셔야 합니다. 동의하시면 하단 버튼을 눌러주세요.",
    responseAgain: "이미 반말 동의를 확인했습니다. 다음 절차를 진행해 주세요.",
    nisuwaz: {
      row: new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('{"step":"start-seat-registration"}')
          .setLabel("동의합니다")
          .setEmoji({ name: "✅" })
          .setStyle(ButtonStyle.Success),
      ),
    },
  },
  "start-seat-registration": {
    response:
      "모든 동의를 확인했습니다.\n\n아래 'SeAT' 버튼을 눌러 웹사이트를 방문하여 이브온라인 계정으로 로그인한 뒤, 메인 캐릭터를 등록하고 '등록 완료'버튼을 눌러주세요. 스파이 방지 등을 위해 필요한 절차입니다.\n**API의 한계로 정보를 받아오는 데 10~30분 정도의 시간이 걸립니다.** 그 동안 혹시 알트가 있으시다면 아래 '가이드' 버튼을 눌러 나오는 사이트를 참고하여 알트를 추가해 주세요.",
    row: new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('{"step":"confirm-seat-registration"}')
        .setLabel("등록 완료")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel("SeAT")
        .setStyle(ButtonStyle.Link)
        .setURL("https://seat.nisuwaz.com/"),
      new ButtonBuilder()
        .setLabel("가이드")
        .setStyle(ButtonStyle.Link)
        .setURL("https://forums.nisuwaz.com/t/seat/224"),
    ),
  },
  "confirm-seat-registration": {
    response: "SeAT 가입이 인증되었습니다. 리크루터를 호출합니다.",
  },
};
