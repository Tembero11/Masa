import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { generateButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";
import Lang from "../classes/Lang";

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

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(Lang.stop.attemptingStop(serverName));
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.stop(serverName);

        embed.setDescription(Lang.stop.stopped(serverName));
        await interaction.editReply({embeds: [embed], components: [generateButtonRow(serverName, server)]});
      }else {
        embed.setDescription(Lang.stop.alreadyOffline(serverName));
        await interaction.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error(err);
      embed.setDescription(Lang.common.unknownErr());
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