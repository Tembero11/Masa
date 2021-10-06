// Commands.addCommand(["latest_backup", "newest_backup"], "Get the latest backup", (msg) => {
  //   getLatestBackup(true).then((latest) => {
  //     let embed = getDefaultCommandEmbed(msg).setTitle("The latest backup is...").setDescription(latest);
  //     msg.channel.send(embed);
  //   });
  // });

  import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getLatestBackup } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";

export class LatestCommand extends Command {
  name = "latest";
  desc = "Returns the latest backup available";
  aliases = ["pong"];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc);

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let latest = await getLatestBackup(true);
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL()).setTitle("The latest backup is...").setDescription(latest);

    await interaction.reply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}