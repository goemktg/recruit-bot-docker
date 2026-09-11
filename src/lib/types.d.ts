import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  AutocompleteInteraction,
  ModalSubmitInteraction,
  CacheType,
  Collection,
} from "discord.js";

export interface SlashCommand {
  command: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  guildType: "recruit";
  autocomplete?: (interaction: AutocompleteInteraction) => void;
  modal?: (interaction: ModalSubmitInteraction<CacheType>) => void;
  cooldown?: number;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, SlashCommand>;
    guildIdMap?: Record<string, string>;
  }
}
