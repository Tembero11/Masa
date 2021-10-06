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

export class RestartCommand extends Command {
  name = "restart";
  desc = "Restart the server";
  aliases = [];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc);

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL())
      .setDescription("Server is restarting...");

    await interaction.reply({ embeds: [embed] });

    try {
      let result = await ServerHandler.restart();
      embed.setDescription(result);

    } catch (err) {
      console.log(err);
      if ((err as any) in ServerHandler.ServerStatus) {
        embed.setDescription(err as string);
      }else {
        embed.setDescription("Something went wrong");
      }
    }

    await interaction.editReply({ embeds: [embed] });
  };

  constructor() {
    super();
  }
}