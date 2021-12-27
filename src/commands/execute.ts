import  { SlashCommandBuilder } from "@discordjs/builders";
import assert from "assert";
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";
import { RepeatCommandButton } from "../buttons/RepeatCommandButton";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";
import { getDefaultCommandEmbed, getExecutableGameCommand, getMessageGameCommand } from "../helpers";
import { ServerHandler } from "../serverHandler";
import Command, { RegisteredCommand } from "./general";

@RegisteredCommand
export class ExecuteCommand extends Command {
  name = "execute";
  desc = "Executes command the specified server";
  aliases = [""];
  builder = new SlashCommandBuilder()
	.setName(this.name)
	.setDescription(this.desc)
  .addStringOption(option => option.setName("server")
  .setDescription("Server to execute the command").setRequired(true))
  .addStringOption(option => option.setName("command").setDescription("Minecraft command to execute").setRequired(true));

  permissionScopes = [
    PermissionScope.ExecuteGameCommands
  ];

  handler = async(interaction: CommandInteraction): Promise<void> => {
    await interaction.deferReply();

    const embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
    const actionRow = new MessageActionRow();
    
    let serverName = interaction.options.getString("server");
    assert(serverName);

    let server = ServerHandler.getServerByName(serverName);

    if (server) {
      if (server.isJoinable) {
        let command = interaction.options.getString("command")?.trim();
        assert(command);


        // Remove slash and add newline
        const executableCommand = getExecutableGameCommand(command);
        const msgCommand = getMessageGameCommand(command);

        server.std.emit("in", executableCommand);

        embed.setDescription(Lang.parse("commands.execute.commandSent", {
          SERVER_NAME: serverName,
          GAME_COMMAND: msgCommand
        }));

        const repeatButton = new RepeatCommandButton().setParameters({
          serverName,
          cmd: command
        });

        // 100 is max length for a custom id
        if (repeatButton.generateCustomId().length <= 100) {
          actionRow.addComponents(repeatButton.getMessageButton(!server.hasStreams))
        }
      }else {
        embed.setDescription(Lang.parse("commands.status.serverOffline", {
          SERVER_NAME: serverName
        }));
      }
    }else {
      embed.setDescription(Lang.parse("common.serverNotFound", {
        SERVER_NAME: serverName
      }));
    }

    let res: any = {embeds: [embed]};

    if (actionRow.components.length > 0) {
      res.components = [actionRow];
    }

    await interaction.editReply(res);
  }
}