// Commands.addCommand("backup", "Create a backup", (msg) => {
//   createNewBackup(BACKUP_TYPE.UserBackup).then(() => {
//     let embed = getDefaultCommandEmbed(msg).setDescription("Backup succesfully created!");

//     msg.channel.send(embed);
//   }).catch(() => {
//     let embed = getDefaultCommandEmbed(msg).setDescription("Backup creation failed!");

//     msg.channel.send(embed);
//   });
// });

import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { BACKUP_TYPE, createNewBackup } from "../backup";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";

export class BackupCommand extends Command {
  name = "backup";
  desc = "Create a backup";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc);

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    try {
      await createNewBackup(BACKUP_TYPE.UserBackup);
      embed.setDescription("Backup succesfully created!");
    }catch(err) {
      embed.setDescription("Backup creation failed!");
    }

    await interaction.reply({embeds: [embed]});
  };

  constructor() {
    super();
  }
}

export const backupCommand = new BackupCommand();