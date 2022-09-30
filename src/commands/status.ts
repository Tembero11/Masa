import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getDefaultCommandEmbed } from "../helpers";
import Command, { RegisteredCommand } from "./general";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";
import Masa from "../classes/Masa";

@RegisteredCommand
export class StatusCommand extends Command {
  name = "status";
  desc = "List of players currently online on the server";
  aliases = ["online", "players"];
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.desc)
    .addStringOption(option => option.setName("server").setDescription("Enter the name of the server you want a backups list from").setRequired(false));

  readonly permissionScopes = [
    PermissionScope.ViewServer
  ];

  handler = async (interaction: CommandInteraction): Promise<void> => {
    const embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());

    embed.setTitle(Lang.parse("commands.status.serverStatusHeader"));

    let servers = Masa.getServers();

    const serverName = interaction.options.getString("server");
    if (serverName) {
      const server = Masa.getServerByName(serverName);
      if (server) {
        servers = [server];
      }else {
        embed.setDescription(Lang.parse("common.serverNotFound", {SERVER_NAME: serverName}));
      }
    }


    const statuses: string[] = [];

    for (const server of servers) {
      if (server.name) {
        const serverBlock: string[] = [];
        if (server.isJoinable) {
          serverBlock.push(Lang.parse("commands.status.serverOnline", {SERVER_NAME: server.name}) + " :green_circle:");
        } else if (!server.hasStreams) {
          serverBlock.push(Lang.parse("commands.status.serverOffline", {SERVER_NAME: server.name}) + " :red_circle:");
        } else if (server.isUnstable) {
          serverBlock.push(Lang.parse("commands.status.serverStarting", {SERVER_NAME: server.name}) + " :yellow_circle:");
        }
        if (server.isJoinable) {
          if (server.getOnlinePlayers().size > 0) {
            serverBlock.push(Lang.parse("commands.status.playersOnline", {PLAYER_COUNT: server.playerCount}));
            serverBlock.push(...server.getOnlinePlayersArray().map(player => player.getUsername()));
          }else {
            serverBlock.push(Lang.parse("commands.status.noPlayers"));
          }
        }

        statuses.push(serverBlock.join("\n"));
      }
    }
    embed.setDescription(statuses.join("\n\n"));

    await interaction.reply({embeds: [embed]});
  };

  constructor() {
    super();
  }
}