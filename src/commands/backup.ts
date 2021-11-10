import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { BackupType, createBackup } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";

export class BackupCommand extends Command {
  name = "backup";
  desc = "Create a backup";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to backup").setRequired(true))
    .addStringOption(option => option.setName("name").setDescription("Enter the name of the backup").setRequired(false));
    
  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      const backupName = interaction.options.getString("name") || undefined;

      let backup = await createBackup(server, serverName, BackupType.User, {name: backupName});
      embed.setDescription(`**${backup.fullname}** was succesfully created!`);
    }catch(err) {
      embed.setDescription("Backup creation failed!");
    }

    await interaction.reply({embeds: [embed]});
  };

  constructor() {
    super();
  }
}