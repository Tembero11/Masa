import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandPermissionData, CommandInteraction } from "discord.js";

export default abstract class Command {
  abstract name: string;
  abstract desc: string;
  abstract aliases: string[];
  abstract builder: Omit<
    SlashCommandBuilder,
    "addSubcommand" | "addSubcommandGroup"
  >;

  abstract handler: (interaction: CommandInteraction) => Promise<void>;
}