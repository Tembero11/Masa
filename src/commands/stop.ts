import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";
import assert from "assert";

export class StopCommand extends Command {
  name = "stop";
  desc = "Stop the server";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to stop").setRequired(true));

  handler = async(interaction: CommandInteraction): Promise<void> => {
      let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
  

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.servers.get(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(`Attempting to stop **${serverName}**...`);
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.stop(serverName);

        embed.setDescription(`**${serverName}** stopped succesfully!`);
        await interaction.editReply({embeds: [embed]});
      }else {
        embed.setDescription(`**${serverName}** is already offline!\n\n *Did you mean /start?*`);
        await interaction.reply({ embeds: [embed] });
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