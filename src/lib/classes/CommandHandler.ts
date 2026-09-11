import {
  REST,
  Routes,
  Collection,
  ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommand } from "../types";
import fs from "node:fs";
import path from "node:path";
import log from "loglevel";

interface CommandFile {
  default: SlashCommand;
}

export class CommandsHandler {
  static async getCommandsFromDir() {
    const commands = new Collection<string, SlashCommand>();

    const commandsDir = path.join(__dirname, "../../commands");
    const commandFiles = fs
      .readdirSync(commandsDir)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      // const commandFile = await import(`${commandsDir}/${file}`);
      const command: SlashCommand = (
        (await import(`${commandsDir}/${file}`)) as CommandFile
      ).default;

      commands.set(command.command.name, command);
    }

    log.info(
      `CommandManager: Loaded ${commands.size} application (/) commands.`,
    );

    return commands;
  }

  static async removeCommands(
    discordClientID: string,
    rest: REST,
    guildId?: string,
  ) {
    const route = guildId
      ? Routes.applicationGuildCommands(discordClientID, guildId)
      : Routes.applicationCommands(discordClientID);

    await rest.put(route, { body: [] });
    log.info(
      `Successfully removed ALL application (/) commands${guildId ? ` from guild ${guildId}` : " globally"}.`,
    );
  }

  static async deployCommands(
    discordClientID: string,
    rest: REST,
    guildId?: string,
  ) {
    const commands = await this.getCommandsFromDir();

    const route = guildId
      ? Routes.applicationGuildCommands(discordClientID, guildId)
      : Routes.applicationCommands(discordClientID);

    await rest.put(route, {
      body: commands.map((command) => command.command.toJSON()),
    });
    log.info(
      `Successfully deployed ${commands.size} application (/) commands${guildId ? ` to guild ${guildId}` : " globally"}.`,
    );
  }

  static async executeCommand(interaction: ChatInputCommandInteraction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      // guildType에 따라 허용된 길드 ID 확인
      const allowedGuildId = interaction.client.guildIdMap?.[command.guildType];

      // 허용된 길드가 아닌 경우 무시
      if (!allowedGuildId || interaction.guildId !== allowedGuildId) {
        log.warn(
          `Command ${command.command.name} executed in unauthorized guild. Expected: ${allowedGuildId}, Got: ${interaction.guildId}`,
        );
        return;
      }

      await command.execute(interaction);
    } catch (error) {
      log.error(`Error executing command ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  }
}
