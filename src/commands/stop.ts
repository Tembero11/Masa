import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";
import { Server } from "https";

export class StopCommand extends Command {
  name = "stop";
  desc = "Stop the server";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc);

  handler = async(interaction: CommandInteraction): Promise<void> => {
      let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
    .setDescription("Server is stopping...");
  
    await interaction.reply({embeds: [embed]});

    try {
      let result = await ServerHandler.stop();
      embed.setDescription(result);
    }catch(err) {
      if ((err as any) in ServerHandler.ServerStatus) {
        embed.setDescription(err as string);
      }else {
        embed.setDescription("Something went wrong");
      }
    }
    await interaction.editReply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}