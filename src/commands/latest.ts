import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { fieldFromBackup, getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";

export class LatestCommand extends Command {
  name = "latest";
  desc = "Returns the latest backup available";
  aliases = [""];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to get the latest backup from").setRequired(true));

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    let serverName = interaction.options.getString("server");
    if (serverName) {
      let server = ServerHandler.getServerByName(serverName);
      if (server) {
        if (server.backups) {
          const latestUser = server.backups.getLatestUser();
          const latestAutomatic = server.backups.getLatestAutomatic();
          const latest = server.backups.getLatest();
  
          if (latest) {
            embed.setTitle("Latest backups")
  
            embed.addField("LATEST BACKUP", "The latest backup from all backups.");
            embed.addFields([fieldFromBackup(latest)]);
  
            if (latestAutomatic) {
              embed.addField("LATEST AUTOMATIC BACKUP", "The latest backup created automatically.");
              embed.addFields([fieldFromBackup(latestAutomatic)]);
            }
            if (latestUser) {
              embed.addField("LATEST USER BACKUP", "The latest backup created by a user.");
              embed.addFields([fieldFromBackup(latestUser)]);
            }
          }else {
            embed.setDescription(`Backups are not enabled for **${serverName}** :slight_frown:`);
          }
        }
      }else {
        embed.setDescription(`**${serverName}** is not a server!`);
      }
    }
    await interaction.reply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}