import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { fieldFromBackup, getDefaultCommandEmbed } from "../helpers";
import { ServerHandler } from "../serverHandler";
import Command from "./general";
import Lang from "../classes/Lang";

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
  
  
          embed.addField(Lang.backups.userHeader(), Lang.backups.listOfUserBackups(), false);
  
          embed.addFields(userBackups.map(fieldFromBackup));
  
          embed.addField(Lang.backups.autoHeader(), Lang.backups.listOfAutoBackups(), false);
  
          embed.addFields(autoBackups.map(fieldFromBackup));
  
          embed.setTitle(Lang.backups.backupsListed()).setTimestamp();
        }else {
          embed.setDescription(Lang.backups.backupsNotEnabled(serverName));
        }
      }else {
        embed.setDescription(Lang.common.serverNotFound(serverName));
      }
    }
    await interaction.reply({embeds: [embed]});
  };
}