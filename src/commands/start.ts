import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";

export class StartCommand extends Command {
  name = "start";
  desc = "Start the server";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc);

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
      .setDescription("Server is starting...")
      
      await interaction.reply({embeds: [embed]});

      try {
        let result = await ServerHandler.start();
        embed.setDescription(result);
      }catch(err) {
        embed.setDescription("An Error occurred when attempting to start the server");
      }

      await interaction.editReply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}