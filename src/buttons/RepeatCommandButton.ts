import assert from "assert";
import { ButtonInteraction, MessageEmbed } from "discord.js";
import Lang from "../classes/Lang";
import { getExecutableGameCommand, getMessageGameCommand } from "../helpers";
import { ServerHandler } from "../serverHandler";
import { GenericButton } from "./GenericButton";

export class RepeatCommandButton extends GenericButton {
  
  readonly customId = "repeat_command";
  readonly rawLabel = "buttons.repeatCommand";
  readonly style = "DANGER";


  handler = async(params: any, interaction: ButtonInteraction) => {
    const { serverName, cmd } = params;
    assert(serverName && cmd);

    let server = ServerHandler.getServerByName(serverName);

    const embed = new MessageEmbed();

    if (server) {
      if (server.isJoinable) {
        const executableCommand = getExecutableGameCommand(cmd);
        const msgCommand = getMessageGameCommand(cmd);

        server.std.emit("in", executableCommand);

        embed.setDescription(Lang.parse(Lang.langFile.commands.execute.commandSent, {
          SERVER_NAME: serverName,
          GAME_COMMAND: msgCommand
        }));
      }else {
        embed.setDescription(Lang.parse(Lang.langFile.commands.status.serverOffline, {
          SERVER_NAME: serverName
        }));
      }
    }else {
      embed.setDescription(Lang.parse(Lang.langFile.common.serverNotFound, {
        SERVER_NAME: serverName
      }));
    }

    interaction.editReply({embeds: [embed]});
  }

  setParameters!: (params: {
    serverName: string
    cmd: string
  }) => this;
}