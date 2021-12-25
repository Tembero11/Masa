import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { fieldFromBackup, getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import { ServerHandler } from "../serverHandler";
import Lang from "../classes/Lang";

@RegisteredCommand
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
            embed.setTitle(Lang.parse("commands.backup.latestBackupHeader"))
  
            embed.addField(Lang.parse("commands.backup.latestBackupHeader"), Lang.parse("commands.backup.latestBackupDesc"));
            embed.addFields([fieldFromBackup(latest)]);
  
            if (latestAutomatic) {
              embed.addField(Lang.parse("commands.backup.latestAutoBackupHeader"), Lang.parse("commands.backup.latestBackupDesc"));
              embed.addFields([fieldFromBackup(latestAutomatic)]);
            }
            if (latestUser) {
              embed.addField(Lang.parse("commands.backup.latestUserBackupHeader"), Lang.parse("commands.backup.latestUserBackupDesc"));
              embed.addFields([fieldFromBackup(latestUser)]);
            }
          }else {
            embed.setDescription(Lang.parse("commands.backup.backupsNotEnabled", {SERVER_NAME: serverName}));
          }
        }
      }else {
        embed.setDescription(Lang.parse("common.serverNotFound", {SERVER_NAME: serverName}));
      }
    }
    await interaction.reply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}