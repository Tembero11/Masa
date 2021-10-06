import  { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { BACKUP_TYPE, listBackups } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";

export class BackupsCommand extends Command {
  name = "backups";
  desc = "List all backups";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc);

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())

    try {
      let autoBackups = await listBackups(BACKUP_TYPE.AutomaticBackup);
      let userBackups = await listBackups(BACKUP_TYPE.UserBackup);

      const mapper = (backup: string) => {
        return `- ${backup}`
      }
      let backups = [
        "**User backups**",
        ...userBackups.map(mapper),
        userBackups.length < 1 ? "No user backups" : "",

        "\n**Automatic Backups**",
        ...autoBackups.map(mapper),
        autoBackups.length < 1 ? "No automatic backups" : "",
      ];

      embed.setTitle("Backups listed").setTimestamp();
  
      embed.setDescription(backups.join("\n"));
    }catch(err) {

    }
    await interaction.reply({embeds: [embed]});
  };
  
  constructor() {
    super();
  }
}