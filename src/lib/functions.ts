import {
  GuildAuditLogsEntry,
  Guild,
  Client,
  ActivityType,
  TextChannel,
  MessageCreateOptions,
} from "discord.js";
import log, { LogLevelDesc } from "loglevel";
import fs from "node:fs";

const fileBackedEnvironmentVariables = ["DISCORD_TOKEN", "SEAT_TOKEN"] as const;

export function loadFileBackedEnvironmentVariables() {
  for (const variableName of fileBackedEnvironmentVariables) {
    if (process.env[variableName]) continue;

    const filePath = process.env[`${variableName}_FILE`];
    if (!filePath) continue;

    const value = fs.readFileSync(filePath, "utf8").trim();
    if (!value) {
      throw new Error(`${variableName}_FILE points to an empty file.`);
    }

    process.env[variableName] = value;
  }
}

/**
 * .env 파일 또는 Docker 환경 변수에서 환경 변수를 로드합니다.
 */
export function loadEnvironmentVariables() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./loadEnvironmentVariables");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    log.warn(".env not found. using docker environment variable");
  }

  loadFileBackedEnvironmentVariables();
}

/**
 * 디스코드 상태를 설정합니다.
 */
export function setDiscordPresence(client: Client, state: string) {
  client.user?.setPresence({
    activities: [
      {
        type: ActivityType.Custom,
        name: "custom",
        state: state,
      },
    ],
  });
}

/**
 * 로그 레벨을 설정합니다
 */
export function setDefaultLogLevel() {
  log.setDefaultLevel((process.env.LOG_LEVEL as LogLevelDesc) || "INFO");
}
