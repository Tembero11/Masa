import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command from "./general";
import * as ServerHandler from "../serverHandler";
import { config } from "../../index";
import Lang from "../classes/Lang";

export class StatusCommand extends Command {
  name = "players";
  desc = "List of players currently online on the server";
  aliases = ["online", "status", "players"];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc);

  handler = async (interaction: CommandInteraction): Promise<void> => {
    let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    embed.setTitle(Lang.status.serverStatusHeader());

    // if (ServerHandler.isServerJoinable) {
    //   embed.setDescription("All systems operational :green_circle:");
    // } else if (!ServerHandler.commandProcess) {
    //   embed.setDescription(`${config["serverName"] || "Server"} is currenly offline :red_circle:`);
    // } else if (ServerHandler.serverStatus === ServerHandler.Presence.SERVER_STARTING) {
    //   embed.setDescription(`${config["serverName"] || "Server"} is currenly starting :yellow_circle:`);
    // } else if (ServerHandler.serverStatus === ServerHandler.Presence.SERVER_STOPPING) {
    //   embed.setDescription(`${config["serverName"] || "Server"} is currenly stopping :yellow_circle:`);
    // }

    // if (config["showPlayers"]) {
    //   let playerList = Array.from(ServerHandler.players.keys()).join("\n");

    //   if (!playerList) {
    //     playerList = "No players online";
    //   }

    //   embed.addField(`${ServerHandler.players.size} online`, playerList);
    // }

    // await interaction.reply({embeds: [embed]});
  };

  constructor() {
    super();
  }
}