import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Command from "./general";

export class PingCommand extends Command {
  name = "ping";
  desc = "pings the bot";
  aliases = ["pong"];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc);

  handler = async(interaction: CommandInteraction): Promise<void> => {
    await interaction.reply("Pong");
  };
  
  constructor() {
    super();
  }
}