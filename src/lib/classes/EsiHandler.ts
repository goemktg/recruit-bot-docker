import axios from "axios";

export class EsiRequester {
  private static readonly PostHeaders = {
    accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  };

  private static readonly GetHeaders = {
    accept: "application/json",
    "Cache-Control": "no-cache",
  };

  static async getIdsFromNames(nameArray: string[]) {
    const url =
      "https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en";
    const headers = { ...this.PostHeaders, "accept-language": "en" };

    const response = await axios.post(url, nameArray, { headers });
    return response.data as APIgetIdsFromNamesResponse;
  }

  static async getNamesFromIds(idArray: number[]) {
    const url =
      "https://esi.evetech.net/latest/universe/names/?datasource=tranquility&language=en";

    const response = await axios.post(url, idArray, {
      headers: this.PostHeaders,
    });
    return response.data as APIgetNamesFromIdsObject[];
  }

  static async getCorpHistoryFromCharId(characterId: string) {
    const response = await axios.get(
      `https://esi.evetech.net/latest/characters/${characterId}/corporationhistory/?datasource=tranquility`,
      { headers: this.GetHeaders },
    );

    return response.data as APIcorpHistoryObject[];
  }

  static async getPriceHistoryFromTypeIdAndRegionId(
    regionId: string,
    typeId: string,
  ) {
    const response = await axios.get(
      `https://esi.evetech.net/latest/markets/${regionId}/history/?datasource=tranquility&type_id=${typeId}`,
      { headers: this.GetHeaders },
    );

    return response.data as APIgetMarketHistoryObject[];
  }

  static async getKillmailInfo(killmailID: number, hash: string) {
    const response = await axios.get(
      `https://esi.evetech.net/latest/killmails/${killmailID}/${hash}/?datasource=tranquility`,
      { headers: this.GetHeaders },
    );

    return response.data as APIkillmailObject;
  }
}

interface APIgetIdsFromNamesResponse {
  characters?: APIcharacterObject[];
}

interface APIcharacterObject {
  id: number;
  name: string;
}

interface APIcorpHistoryObject {
  corporation_id: number;
  record_id: number;
  start_date: string;
}

interface APIgetNamesFromIdsObject {
  category:
    | "alliance"
    | "character"
    | "constellation"
    | "corporation"
    | "inventory_type"
    | "region"
    | "solar_system"
    | "station"
    | "faction";
  id: number;
  name: string;
}

interface APIgetMarketHistoryObject {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
  volume: number;
}

interface APIkillmailObject {
  attackers: APIattackerObject[];
  killmail_id: number;
  killmail_time: string;
  solar_system_id: number;
  victim: {
    alliance_id: number;
    character_id: number;
    corporation_id: number;
    damage_taken: number;
    items: APIitemsObject[];
    position: {
      x: number;
      y: number;
      z: number;
    };
    ship_type_id: number;
  };
}

interface APIattackerObject {
  alliance_id: number;
  character_id: number;
  corporation_id: number;
  damage_done: number;
  final_blow: boolean;
  security_status: number;
  ship_type_id: number;
  weapon_type_id: number;
}

interface APIitemsObject {
  flag: number;
  item_type_id: number;
  quantity_destroyed?: number;
  quantity_dropped?: number;
  singleton: number;
}
