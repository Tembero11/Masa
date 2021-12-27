import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { generateServerButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";

@RegisteredCommand
export class StartCommand extends Command {
  name = "start";
  desc = "Start the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to start").setRequired(true));

  permissionScopes = [
    PermissionScope.StartServer
  ];

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        if (server.isJoinable) {
          embed.setDescription(Lang.parse("commands.start.alreadyOnline", {SERVER_NAME: serverName}));
        }else {
          embed.setDescription(Lang.parse("commands.start.alreadyStarting", {SERVER_NAME: serverName}));
        }
        await interaction.reply({ embeds: [embed] });
      }else {
        embed.setDescription(Lang.parse("commands.start.attemptingStart", {SERVER_NAME: serverName}));
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.start(serverName);
        embed.setDescription(Lang.parse("commands.start.started", {SERVER_NAME: serverName}));
        await interaction.editReply({ embeds: [embed], components: [generateServerButtonRow(serverName, server)] });
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