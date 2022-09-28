import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { fieldFromBackup, getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";

@RegisteredCommand
export class BackupsCommand extends Command {
  name = "backups";
  desc = "List all backups";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want a backups list from").setRequired(true));

  readonly permissionScopes = [
    PermissionScope.ViewBackups
  ];

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    let serverName = interaction.options.getString("server");
    if (serverName) {
      // if (server) {
      //   if (server.backups) {
      //     let autoBackups = server.backups.listAutomatic();
      //     let userBackups = server.backups.listUser();
  
  
      //     embed.addField(Lang.parse("commands.backup.userHeader"), Lang.parse("commands.backup.listOfUserBackups"), false);
  
      //     embed.addFields(userBackups.map(fieldFromBackup));
  
      //     embed.addField(Lang.parse("commands.backup.autoHeader"), Lang.parse("commands.backup.listOfAutoBackups"), false);
  
      //     embed.addFields(autoBackups.map(fieldFromBackup));
  
      //     embed.setTitle(Lang.parse("commands.backup.backupsListed")).setTimestamp();
      //   }else {
      //     embed.setDescription(Lang.parse("commands.backup.backupsNotEnabled", {SERVER_NAME: serverName}));
      //   }
      // }else {
      //   embed.setDescription(Lang.parse("common.serverNotFound", {SERVER_NAME: serverName}));
      // }
    }
    await interaction.reply({embeds: [embed]});
  };
}