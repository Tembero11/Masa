import  { SlashCommandBuilder } from "@discordjs/builders";
import assert from "assert";
import { CommandInteraction } from "discord.js";
import { BackupMetadata, BackupType, getLatestBackup } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import date from "date-and-time";

export class LatestCommand extends Command {
  name = "latest";
  desc = "Returns the latest backup available";
  aliases = [""];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to get the latest backup from").setRequired(true));

  handler = async(interaction: CommandInteraction): Promise<void> => {
    let latest: BackupMetadata | null;
    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      latest = await getLatestBackup(serverName);
      if (latest) {
        let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
        .setTitle("The latest backup is...")
        .setDescription(`**${latest.filename}** -> ${date.format(latest.created, "DD/MM/YYYY HH:mm:ss")}`);

        await interaction.reply({embeds: [embed]});
      }else {
        let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
          .setDescription("There are now backups :slight_frown:")

        await interaction.reply({embeds: [embed]});
      }
    }catch(err) {
      console.log(err);
      let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
        .setDescription("Something went wrong :slight_frown:")

      await interaction.reply({ embeds: [embed] });
    }
  };
  
  constructor() {
    super();
  }
}