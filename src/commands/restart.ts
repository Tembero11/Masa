// Commands.addCommand("restart", "Restart the server", (msg) => {
//   let embed = getDefaultCommandEmbed(msg)
//   .setDescription("Server is restarting...");

//   msg.channel.send(embed).then((msg) => {
//     ServerHandler.restart().then((result) => {
//       embed.setDescription(result.status);
//       msg.edit(embed);
//     }).catch((result) => {
//       embed.setDescription(result.status);
//       msg.edit(embed);
//     });
//   })
// });
// Commands.addCommand("easteregg", "An easter egg :egg:", (msg) => {
//   msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
// });

import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";
import assert from "assert";

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

      let server = ServerHandler.servers.get(serverName);
      assert(server);

      embed.setDescription(`Attempting to ${server.hasStreams ? "restart" : "start"} **${serverName}**...`);
      
      await interaction.reply({ embeds: [embed] });

      await ServerHandler.restart(serverName);
      embed.setDescription(`${serverName} restarted succesfully!`);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      embed.setDescription("Something went wrong :slight_frown:");
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