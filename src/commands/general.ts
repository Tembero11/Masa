import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { PermissionScope } from "../classes/PermissionManager";



export default abstract class Command {
  abstract name: string;
  abstract desc: string;
  abstract aliases: string[];
  abstract builder: Omit<
    SlashCommandBuilder,
    "addSubcommand" | "addSubcommandGroup"
  >;

  readonly abstract permissionScopes: PermissionScope[];

  abstract handler: (interaction: CommandInteraction) => Promise<void>;
}

export const commands = new Map<string, Command>();

// Used as a decorator when creating a command
export function RegisteredCommand(Cmd: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const cmd = new Cmd();
  // console.log(cmd);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  commands.set(cmd.name, cmd);
}