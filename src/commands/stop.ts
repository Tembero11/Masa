import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { generateServerButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";

@RegisteredCommand
export class StopCommand extends Command {
  name = "stop";
  desc = "Stop the server";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to stop").setRequired(true));

  readonly permissionScopes = [
    PermissionScope.StopServer
  ];

  handler = async(interaction: CommandInteraction): Promise<void> => {
      let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
  

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(Lang.parse("commands.stop.attemptingStop", {SERVER_NAME: serverName}));
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.stop(serverName);

        embed.setDescription(Lang.parse("commands.stop.stopped", {SERVER_NAME: serverName}));
        await interaction.editReply({embeds: [embed], components: [generateServerButtonRow(serverName, server)]});
      }else {
        embed.setDescription(Lang.parse("commands.stop.alreadyOffline", {SERVER_NAME: serverName}));
        await interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error(err);
      embed.setDescription(Lang.parse("common.unknownErr"));
      if (interaction.replied) {
        await interaction.editReply({embeds: [embed]});
      }else {
        await interaction.reply({embeds: [embed]});
      }
    }
  };
  
  constructor() {
    super();
  }
}