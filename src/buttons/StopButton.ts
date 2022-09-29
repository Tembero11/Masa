import assert from "assert";
import { MessageButtonStyleResolvable, ButtonInteraction, MessageEmbed } from "discord.js";
import Lang from "../classes/Lang";
import Masa from "../classes/Masa";
import { PermissionScope } from "../classes/PermissionManager";
import { GenericButton } from "./GenericButton";

export class StopButton extends GenericButton {
  readonly customId = "server_stop";
  readonly labelLangPath = "buttons.stop";
  readonly style = "DANGER";

  permissionScopes = [
    PermissionScope.StopServer
  ]

  handler = async (params: any, interaction: ButtonInteraction) => {
    // const { serverName } = params;
    // assert(serverName);

    // const server = Masa.getServerByName(serverName);
    // assert(server);

    // let embed = new MessageEmbed();

    // if (server.hasStreams) {
    //   server.safeStop();
    //   await server.waitfor("close");
    //   embed.setDescription(Lang.parse("commands.stop.stopped", { SERVER_NAME: serverName }));
    // }else {
    //   embed.setDescription(Lang.parse("commands.stop.alreadyOffline", { SERVER_NAME: serverName }));
    // }

    // await interaction.editReply({ embeds: [embed] });
  }

  setParameters!: (params: {
    serverName: string
  }) => this;
}