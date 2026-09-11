import axios from "axios";
import log from "loglevel";

// axios의 기본 헤더를 제거하는 인터셉터 설정
axios.interceptors.request.use((config) => {
  // 기본 Accept 헤더 제거
  delete config.headers.Accept;
  return config;
});

export class SeatHandler {
  private static DeleteHeaders: object;
  private static PostHeaders: object;
  private static GetHeaders: object;

  private static initialize() {
    if (process.env.SEAT_TOKEN === undefined)
      throw new Error("SEAT_TOKEN is not defined in .env file.");

    SeatHandler.DeleteHeaders = {
      accept: "*/*",
      "X-TOKEN": process.env.SEAT_TOKEN,
    };
    SeatHandler.PostHeaders = {
      accept: "*/*",
      "Content-Type": "application/json",
      "X-TOKEN": process.env.SEAT_TOKEN,
    };
    SeatHandler.GetHeaders = {
      accept: "application/json",
      "X-TOKEN": process.env.SEAT_TOKEN,
    };
  }

  /**
   * seatUserId에 해당하는 유저에게 seatRoleId 롤을 제거합니다.
   * @param {string} seatUserId
   * @param {string} seatRoleId
   */
  static async removeUserRole(seatUserId: string, seatRoleId: string) {
    this.initialize();
    log.info(`removing role ${seatRoleId} from user ${seatUserId}`);

    await axios.delete(
      `https://seat.nisuwaz.com/api/v2/roles/members/${seatUserId}/${seatRoleId}`,
      { headers: this.DeleteHeaders },
    );
  }

  /**
   * seatUserId에 해당하는 유저에게 seatRoleId 롤을 부여합니다.
   * @param {string} seatUserId
   * @param {string} seatRoleId
   */
  static async addUserRole(seatUserId: string, seatRoleId: string) {
    this.initialize();
    log.info(`adding role ${seatRoleId} to user ${seatUserId}`);

    const url = "https://seat.nisuwaz.com/api/v2/roles/members";
    const data = {
      user_id: seatUserId,
      role_id: seatRoleId,
    };

    await axios.post(url, data, { headers: this.PostHeaders });
  }

  /**
   * page에 해당하는 seat 유저들을 가져옵니다.
   * @param {number} page
   * @returns {Promise<APIGetSeatUsersResponse>}
   */
  static async getUsers(page = 1): Promise<APIGetSeatUsersResponse> {
    this.initialize();
    const response = await axios.get(
      `https://seat.nisuwaz.com/api/v2/users?page=${page}`,
      { headers: this.GetHeaders },
    );

    return (await response.data) as APIGetSeatUsersResponse;
  }

  /**
   * characterId에 해당하는 캐릭터의 시트를 가져옵니다.
   * @param {string} characterId
   * @returns {Promise<APIGetSeatCharacterSheetResponse>}
   */
  static async getCharacterSheetFromId(
    characterId: string,
  ): Promise<APIGetSeatCharacterSheetResponse> {
    this.initialize();
    const response = await axios.get(
      `https://seat.nisuwaz.com/api/v2/character/sheet/${characterId}`,
      { headers: this.GetHeaders },
    );

    return (await response.data) as APIGetSeatCharacterSheetResponse;
  }

  static async getUserFromId(userId: number) {
    this.initialize();
    const response = await axios.get(
      `https://seat.nisuwaz.com/api/v2/users/${userId}`,
      { headers: this.GetHeaders },
    );

    return (await response.data) as APIGetSeatUserResponse;
  }

  static async getCorpContracts(corpId: number, page: number) {
    this.initialize();
    const response = await axios.get(
      `https://seat.nisuwaz.com/api/v2/corporation/contracts/${corpId}?page=${page}`,
      { headers: this.GetHeaders },
    );

    return (await response.data) as APIGetContractsResponse;
  }
}

interface seatEntity {
  entity_id: number;
  name: string;
  category: string;
}

interface APIGetSeatUsersResponse {
  data: SeatUser[];
  links: {
    first: string;
    last: string;
    prev: string;
    next: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

interface APIGetContractsResponse {
  data: SeatContract[];
  links: {
    first: string;
    last: string;
    prev: string;
    next: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

interface SeatContract {
  contract_id: number;
  type: string;
  status: string;
  title: string;
  for_corporation: boolean;
  availability: string;
  date_issued: string;
  date_expired: string;
  date_accepted: string;
  days_to_complete: number;
  date_completed: string;
  price: number;
  reward: number;
  collateral: number;
  buyout: number;
  volume: number;
  issuer: seatEntity;
  assignee: seatEntity;
  acceptor: seatEntity;
  // TODO: add lines field
  // lines
}

interface APIGetSeatCharacterSheetResponse {
  data: SeatCharacterSheet;
}

interface APIGetSeatUserResponse {
  data: SeatUser;
}

interface SeatUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  last_login: string;
  last_login_source: string;
  associated_character_ids: string[];
  main_character_id: string;
}

interface SeatCharacterSheet {
  name: string;
  description: string;
  corporation?: {
    entity_id: number;
    name: string;
    category: "corporation";
  };
  alliance?: {
    entity_id: number;
    name: string;
    category: "alliance";
  };
  faction: {
    entity_id: null;
    name: string;
    category: "faction";
  };
  birthday: string;
  gender: string;
  race_id: number;
  bloodline_id: number;
  security_status: number;
  balance: number;
  skillpoints: {
    total_sp: number;
    unallocated_sp: number;
  };
  user_id: number;
}
