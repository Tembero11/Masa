import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";
import assert from "assert";

export class StartCommand extends Command {
  name = "start";
  desc = "Start the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to start").setRequired(true));

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.servers.get(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(`**${serverName}** is already ${server.isJoinable ? "online" : "starting"}!\n\n *Did you mean /restart?*`);
        await interaction.reply({ embeds: [embed] });
      }else {
        embed.setDescription(`Attempting to start **${serverName}**...`);
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.start(serverName);
        embed.setDescription(`**${serverName}** started succesfully!`);
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error(err);
      embed.setDescription("Something went wrong :slight_frown:");
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