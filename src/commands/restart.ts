import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { generateButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";

export class RestartCommand extends Command {
  name = "restart";
  desc = "Restart the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to restart").setRequired(true));

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
      
    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      embed.setDescription(`Attempting to ${server.hasStreams ? "restart" : "start"} **${serverName}**...`);
      
      await interaction.reply({ embeds: [embed] });

      await ServerHandler.restart(serverName);
      embed.setDescription(`${serverName} restarted succesfully!`);
      await interaction.editReply({ embeds: [embed], components: [generateButtonRow(serverName, server)] });
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