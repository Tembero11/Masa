import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { generateServerButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import assert from "assert";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";
import Masa from "../classes/Masa";

@RegisteredCommand
export class RestartCommand extends Command {
  name = "restart";
  desc = "Restart the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to restart").setRequired(true));

  readonly permissionScopes = [
    PermissionScope.StartServer,
    PermissionScope.StopServer
  ];

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
      
    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = Masa.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(Lang.parse("commands.restart.attemptingRestart", {SERVER_NAME: serverName}))
      }else {
        embed.setDescription(Lang.parse("commands.start.attemptingStart", {SERVER_NAME: serverName}))
      }
      
      await interaction.reply({ embeds: [embed] });
      // TODO: RESTART
      // await ServerHandler.restart(serverName);
      embed.setDescription(Lang.parse("commands.restart.restarted", {SERVER_NAME: serverName}));
      await interaction.editReply({ embeds: [embed], components: [generateServerButtonRow(serverName, server)] });
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