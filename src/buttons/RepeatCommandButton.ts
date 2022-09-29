import assert from "assert";
import { ButtonInteraction, EmojiIdentifierResolvable, MessageEmbed } from "discord.js";
import Lang, { LangPath } from "../classes/Lang";
import Masa from "../classes/Masa";
import { PermissionScope } from "../classes/PermissionManager";
import { getExecutableGameCommand, getMessageGameCommand } from "../helpers";
import { GenericButton } from "./GenericButton";

export class RepeatCommandButton extends GenericButton {
  readonly customId = "repeat_command";
  readonly labelLangPath = "buttons.repeatCommand";
  readonly style = "DANGER";

  readonly permissionScopes = [
    PermissionScope.ExecuteGameCommands
  ]


  handler = async (params: any, interaction: ButtonInteraction) => {
    // const { serverName, cmd } = params;
    // assert(serverName && cmd);

    // let server = Masa.getServerByName(serverName);

    // const embed = new MessageEmbed();

    // if (server) {
    //   if (server.isJoinable) {
    //     const executableCommand = getExecutableGameCommand(cmd);
    //     const msgCommand = getMessageGameCommand(cmd);

    //     server.std.emit("in", executableCommand);

    //     embed.setDescription(Lang.parse("commands.execute.commandSent", {
    //       SERVER_NAME: serverName,
    //       GAME_COMMAND: msgCommand
    //     }));
    //   } else {
    //     embed.setDescription(Lang.parse("commands.status.serverOffline", {
    //       SERVER_NAME: serverName
    //     }));
    //   }
    // } else {
    //   embed.setDescription(Lang.parse("common.serverNotFound", {
    //     SERVER_NAME: serverName
    //   }));
    // }

    // interaction.editReply({ embeds: [embed] });
  }

  setParameters!: (params: {
    serverName: string
    cmd: string
  }) => this;
}