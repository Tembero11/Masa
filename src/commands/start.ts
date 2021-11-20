import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { generateButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";
import Lang from "../classes/Lang";

export class StartCommand extends Command {
  name = "start";
  desc = "Start the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to start").setRequired(true));

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        if (server.isJoinable) {
          embed.setDescription(Lang.start.alreadyOnline(serverName));
        }else {
          embed.setDescription(Lang.start.alreadyStarting(serverName));
        }
        await interaction.reply({ embeds: [embed] });
      }else {
        embed.setDescription(Lang.start.attemptingStart(serverName));
        await interaction.reply({ embeds: [embed] });

        await ServerHandler.start(serverName);
        embed.setDescription(Lang.start.started(serverName));
        await interaction.editReply({ embeds: [embed], components: [generateButtonRow(serverName, server)] });
      }
    } catch (err) {
      console.error(err);
      embed.setDescription(Lang.common.unknownErr());
      if (interaction.replied) {
        await interaction.editReply({embeds: [embed]});
      }else {
        await interaction.reply({embeds: [embed]});
      }
    }
  };

  constructor() {
    super();
  }
}