const evegallbanCorpArray = ['9th Division', '072 kong Corporation', 'AOJI Colliery', 'Black Parrot', 'CLOUD TEMPLE', 'COK', 'DANGERCLOSE ARTILLERY', 'Enterprise DoubleK Corporation', 'Full-Moon Corporation', 'Godspeed to us all', 'Golden Family', 'Helper Sisters Of EVE', 'JustSayNo2Taxes', 'KingDom of The Wind', 'Luv is taken Down', 'Macabre Votum', 'Make Some Money.', 'Manami Crazy Newbie', 'Manami Logics Inter Corporation', 'MIRINAE.', 'MoonRabbit Collective', 'MoonRabbit Council', 'Moving Star', 'NullSsay', 'Prima Stella', 'Republic of Korea SWORD.Corporation', 'Return Of The King', 'Sword Breaker SKY Corporation', 'Takealook.', 'Twizzlespark Inc.', 'Visteen Social Welfare Cooperation Project', 'W.I.M Inc.', '' ];
const evegallbanCharArray = ['072 kong', '072 kong-ja', '3vent Horizon', 'Ahri Redfox', 'Aajer Ci', 'Al-Bak-Lee', 'Alizee Virgin', 'Alkira B', 'Antonio Dinolfo', 'Arak Qao', 'Arms Trader', 'Artanis Lee', 'Arya Slark', 'Ash Grayhorn', 'AWPerfect -DC', 'Barosca', 'BisangGu', 'BisangGu 3', 'BisangGu Hita', 'BisangGu4', 'Blanka LaSorcistino', 'BLESSED NAME', 'Blythe Barrymore', 'bulletmusic', 'bulletpunch', 'bulletspeed', 'Ceia Visteen', 'Clor2', 'Cochineal Carotinoid', 'Ctrl Ctrill', 'Dang ding', 'dltmdgkr1', 'Down Drop', 'Enfold Heleneto', 'eric0135 Arkaral', 'Estel Mythchoi', 'evedead Antollare', 'firefly Shy', 'firefly Wind', 'Flower Fallen', 'Gallente Citizen 246911908', 'GrimaGOON', 'Guyner Kashnap', 'Halphas Arthie', 'Head Hunter Sentinal', 'hellbard Ch', 'Heurin bada', 'Heyzo', 'HG Captain', 'Hong Zanjoahir', 'Jin Fehrnah', 'jinho yeom', 'JOHN CENA IDIOT', 'kabin hiness', 'Karakoo', 'Karapub', 'khaki klein', 'Kiranes', 'KOCAINE CONNECT', 'kyu-ho jun', 'Leblanc Stein', 'Leffe Brown', 'Liberal Sparrow', 'LiEel Afuran', 'Lightgazer Aihaken', 'Lilis Skyremix', 'Lonely Christmas', 'Luv Star', 'LYGIA', 'Mecatama Mk2', 'Mei Ji Yang', 'Mellan Gior', 'Ministo Meteorito', 'Mister Plate', 'Mister Platee', 'Mister Plates', 'naur tirednaur', 'Neia Ghosthazard', 'Neria Kashnap', 'Oral B Siesta', 'Oscar Menalque', 'Paowuuka', 'Pectus Solentis', 'poiup', 'ray sang', 'Rin Leo', 'romi da', 'S Nidor', 'Sakura Chiyo', 'Sandra Duke', 'Saya Len', 'Sellesti Klein', 'Seowon Jung', 'seryuyo Kagura', 'Sexy Bomb', 'Shiori Snow', 'Skillplan Test', 'Sohpie Vista', 'Sonora Min', 'Sword Breaker SKY', 'syub95', 'Tab Tablet', 'Twizzlespark', 'Twizzlespark Celes', 'VengeanceMK2', 'vfbank86', 'whatwhat theHell', 'Wicked Capital', 'Young9', 'zeratul Lee' ];
// const evegallbanAlliArray = ['DSIM']; TODO : 얼라이언스 밴 감지 기능 추가
const evegallSecondbanCharArray = ['Arablo', 'roby sang', 'DancingOnTheMoon'];
const evegallSecondbanCorpArray = ['A green bird', 'AMC.', 'AMC.HD', 'AMC.WHD', 'Kill Mail Delivery', 'Night Fog Fleet'];

const nisuwazbanCharArray = ['Noh Jinho', 'Kahi Nari', 'RNZAF', 'RNZAF-04', 'RNZAF-2', 'RNZAF-G', 'RNZAF-M', 'RNZAF-M2', 'ROKNM', 'Sigourney Cleaver'];

const banData = {
	evegall: {
		char: evegallbanCharArray,
		corp: evegallbanCorpArray,
	},
	evegall_boycott: {
		char: evegallSecondbanCharArray,
		corp: evegallSecondbanCorpArray,
	},
	nisuwaz: {
		char: nisuwazbanCharArray,
	},
};

const banDataStringMapping = {
	'evegall': '입갤 밴',
	'evegall_boycott': '입갤 새컨더리 보이콧',
	'nisuwaz': '니수와 - 소맥/소주 밴',
	'corp': '코퍼레이션은',
	'char': '캐릭터는',
};

module.exports = { banData, banDataStringMapping };