import  { SlashCommandBuilder } from "@discordjs/builders";
import assert from "assert";
import { CommandInteraction } from "discord.js";
import { BackupMetadata, BackupType, listBackups } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import * as ServerHandler from "../serverHandler";
import Command from "./general";

export class BackupsCommand extends Command {
  name = "backups";
  desc = "List all backups";
  aliases = [];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want a backups list from").setRequired(true));

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.servers.get(serverName);
      assert(server);

      let autoBackups = await listBackups(serverName, BackupType.Automatic);
      let userBackups = await listBackups(serverName, BackupType.User);

      const mapper = (backup: BackupMetadata) => {
        return `- ${backup.filename}`
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