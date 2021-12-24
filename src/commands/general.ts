import { SlashCommandBuilder } from "@discordjs/builders";
import assert from "assert";
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

export const commands = new Map<string, Command>();

// Used as a decorator when creating a command
export function RegisteredCommand(Cmd: any) {
  const cmd = new Cmd();
  // console.log(cmd);
  commands.set(cmd.name, cmd);
}