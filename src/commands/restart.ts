import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { generateButtonRow, getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import { ServerHandler } from "../serverHandler";
import assert from "assert";
import Lang from "../classes/Lang";

export class RestartCommand extends Command {
  name = "restart";
  desc = "Restart the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want to restart").setRequired(true));

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
      
    try {
      let serverName = interaction.options.getString("server");
      assert(serverName);

      let server = ServerHandler.getServerByName(serverName);
      assert(server);

      if (server.hasStreams) {
        embed.setDescription(Lang.parse(Lang.langFile.commands.restart.attemptingRestart, {SERVER_NAME: serverName}))
      }else {
        embed.setDescription(Lang.parse(Lang.langFile.commands.start.attemptingStart, {SERVER_NAME: serverName}))
      }
      
      await interaction.reply({ embeds: [embed] });

      await ServerHandler.restart(serverName);
      embed.setDescription(Lang.parse(Lang.langFile.commands.restart.restarted, {SERVER_NAME: serverName}));
      await interaction.editReply({ embeds: [embed], components: [generateButtonRow(serverName, server)] });
    } catch (err) {
      console.error(err);
      embed.setDescription(Lang.parse(Lang.langFile.common.unknownErr));
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