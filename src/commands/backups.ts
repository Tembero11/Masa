import  { SlashCommandBuilder } from "@discordjs/builders";
import assert from "assert";
import date from "date-and-time";
import { table } from "table";
import { CommandInteraction } from "discord.js";
import { BackupMetadata } from "../classes/server/BackupModule";
// import { BackupMetadata, BackupType, listBackups } from "../backup";
import { fieldFromBackup, getDefaultCommandEmbed } from "../helpers";
import { ServerHandler } from "../serverHandler";
import Command from "./general";
import { config } from "../setup";

export class BackupsCommand extends Command {
  name = "backups";
  desc = "List all backups";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want a backups list from").setRequired(true));

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    let serverName = interaction.options.getString("server");
    if (serverName) {
      let server = ServerHandler.getServerByName(serverName);
      if (server) {
        if (server.backups) {
          let autoBackups = server.backups.listAutomatic();
          let userBackups = server.backups.listUser();
  
  
          embed.addField("**USER**", "List of user created backups", false);
  
          embed.addFields(userBackups.map(fieldFromBackup));
  
          embed.addField("**AUTOMATIC**", "List of automatic backups", false);
  
          embed.addFields(autoBackups.map(fieldFromBackup));
  
          embed.setTitle("Backups listed").setTimestamp();
        }else {
          embed.setDescription(`Backups are not enabled for **${serverName}** :slight_frown:`);
        }
      }else {
        embed.setDescription(`**${serverName}** is not a server!`);
      }
    }
    await interaction.reply({embeds: [embed]});
  };
}