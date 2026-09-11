import { Client, TextChannel } from "discord.js";
import log from "loglevel";
import { StateMachineHandler } from "./StateMachineHandler";
import { RecruitHandler } from "./Handler";

/**
 * State 백업 및 복원을 담당하는 클래스
 */
export class StateBackup {
  private client: Client;
  private stateMachineHandler: StateMachineHandler;
  private backupChannelName: string;
  private guildId: string;

  constructor(
    client: Client,
    stateMachineHandler: StateMachineHandler,
    backupChannelName: string,
    guildId: string,
  ) {
    this.client = client;
    this.stateMachineHandler = stateMachineHandler;
    this.backupChannelName = backupChannelName;
    this.guildId = guildId;
  }

  /**
   * 현재 state를 디스코드 채널에 백업
   */
  async backupState(): Promise<void> {
    try {
      log.info("StateBackup: Starting state backup...");

      // 길드에서 채널 이름으로 찾기
      const guild = await this.client.guilds.fetch(this.guildId);
      const channel = guild.channels.cache.find(
        (c) =>
          c.type === 0 && (c as TextChannel).name === this.backupChannelName,
      ) as TextChannel | undefined;

      if (!channel || !channel.isTextBased()) {
        log.error(
          `StateBackup: Backup channel '${this.backupChannelName}' not found or not a text channel`,
        );
        return;
      }

      // 모든 활성 세션 가져오기
      const sessions = this.stateMachineHandler.getActiveSessions();

      if (Object.keys(sessions).length === 0) {
        log.info("StateBackup: No active sessions to backup");
        return;
      }

      // 이전 백업 삭제
      const messages = await channel.messages.fetch({ limit: 100 });
      const backupMessages = messages.filter((m) =>
        m.content.includes("State Backup"),
      );
      for (const message of backupMessages.values()) {
        await message.delete();
      }
      if (backupMessages.size > 0) {
        log.info(
          `StateBackup: Deleted ${backupMessages.size} old backup messages`,
        );
      }

      // JSON으로 변환하여 저장
      const backupData = {
        timestamp: new Date().toISOString(),
        sessions: sessions,
      };

      const jsonString = JSON.stringify(backupData, null, 2);

      // 메시지가 2000자를 넘으면 파일로 업로드
      if (jsonString.length > 1900) {
        const buffer = Buffer.from(jsonString, "utf-8");
        await channel.send({
          content: `**State Backup** - ${new Date().toLocaleString("ko-KR")}`,
          files: [
            {
              attachment: buffer,
              name: `state-backup-${Date.now()}.json`,
            },
          ],
        });
      } else {
        await channel.send({
          content: `**State Backup** - ${new Date().toLocaleString("ko-KR")}\n\`\`\`json\n${jsonString}\n\`\`\``,
        });
      }

      log.info(
        `StateBackup: Successfully backed up ${Object.keys(sessions).length} sessions`,
      );
    } catch (error) {
      log.error("StateBackup: Error during backup:", error);
    }
  }

  /**
   * 디스코드 채널에서 마지막 백업 데이터를 복원
   */
  async restoreState(recruitHandler: RecruitHandler): Promise<void> {
    try {
      log.info("StateBackup: Starting state restoration...");

      // 길드에서 채널 이름으로 찾기
      const guild = await this.client.guilds.fetch(this.guildId);
      const channel = guild.channels.cache.find(
        (c) =>
          c.type === 0 && (c as TextChannel).name === this.backupChannelName,
      ) as TextChannel | undefined;

      if (!channel || !channel.isTextBased()) {
        log.error(
          `StateBackup: Backup channel '${this.backupChannelName}' not found or not a text channel`,
        );
        return;
      }

      // 최근 메시지 가져오기
      const messages = await channel.messages.fetch({ limit: 10 });

      for (const message of messages.values()) {
        if (message.content.includes("State Backup")) {
          let backupData = null;

          // 첨부 파일이 있으면 다운로드
          if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (attachment && attachment.name.endsWith(".json")) {
              const response = await fetch(attachment.url);
              const jsonText = await response.text();
              backupData = JSON.parse(jsonText);
            }
          } else {
            // 메시지 내용에서 JSON 추출
            const jsonMatch = message.content.match(/```json\n([\s\S]+)\n```/);
            if (jsonMatch) {
              backupData = JSON.parse(jsonMatch[1]);
            }
          }

          if (backupData && backupData.sessions) {
            log.info(`StateBackup: Found backup from ${backupData.timestamp}`);

            // 각 세션 복원
            for (const [channelId, sessionData] of Object.entries(
              backupData.sessions,
            )) {
              try {
                const recruitChannel = (await this.client.channels.fetch(
                  channelId,
                )) as TextChannel;
                if (recruitChannel && recruitChannel.isTextBased()) {
                  // 채널 이름에서 채널명 추출
                  const channelName = recruitChannel.name;

                  log.info(
                    `StateBackup: Restoring session for channel ${channelName} (${channelId})`,
                  );

                  // 세션 복원 (RecruitHandler를 통해)
                  // 주의: context 데이터의 interaction 객체는 복원할 수 없으므로 null로 설정
                  const session: any = sessionData;
                  await recruitHandler.restoreSession(
                    channelId,
                    channelName,
                    recruitChannel,
                    session,
                  );
                }
              } catch (error) {
                log.error(
                  `StateBackup: Error restoring session for channel ${channelId}:`,
                  error,
                );
              }
            }

            log.info("StateBackup: State restoration completed");
            return;
          }
        }
      }

      log.info("StateBackup: No backup data found");
    } catch (error) {
      log.error("StateBackup: Error during restoration:", error);
    }
  }

  /**
   * 오래된 백업 메시지 정리 (최근 1개만 유지)
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      const channel = guild.channels.cache.find(
        (c) =>
          c.type === 0 && (c as TextChannel).name === this.backupChannelName,
      ) as TextChannel | undefined;

      if (!channel || !channel.isTextBased()) {
        return;
      }

      const messages = await channel.messages.fetch({ limit: 100 });
      const backupMessages = messages.filter((m) =>
        m.content.includes("State Backup"),
      );

      if (backupMessages.size > 1) {
        const messagesToDelete = Array.from(backupMessages.values()).slice(1);
        for (const message of messagesToDelete) {
          await message.delete();
        }
        log.info(
          `StateBackup: Cleaned up ${messagesToDelete.length} old backup messages`,
        );
      }
    } catch (error) {
      log.error("StateBackup: Error during cleanup:", error);
    }
  }
}
