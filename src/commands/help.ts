import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";
import { getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";

@RegisteredCommand
export class HelpCommand extends Command {
  name = "help";
  desc = "List of helpful commands";
  aliases = ["commands"];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc);

  permissionScopes = [
    PermissionScope.HarmlessCommands
  ];

  // eslint-disable-next-line @typescript-eslint/require-await
  handler = async (interaction: CommandInteraction) => {
    const embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    embed.setTitle(Lang.parse("commands.help.listOfCommands"));
    embed.setDescription(Lang.parse("commands.help.helpDesc"));
  };

  constructor() {
    super();
  }
}