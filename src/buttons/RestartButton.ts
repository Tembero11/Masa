import assert from "assert";
import { MessageButtonStyleResolvable, ButtonInteraction, MessageEmbed } from "discord.js";
import Lang from "../classes/Lang";
import { PermissionScope } from "../classes/PermissionManager";
import { GenericButton } from "./GenericButton";

export class RestartButton extends GenericButton {
  readonly customId = "server_restart";
  readonly labelLangPath = "buttons.restart";
  readonly style = "DANGER";

  permissionScopes = [
    PermissionScope.StartServer,
    PermissionScope.StopServer
  ]

  handler = async (params: any, interaction: ButtonInteraction) => {
    const { serverName } = params;
    assert(serverName);

    let embed = new MessageEmbed();
    // TODO: RESTART
    // await ServerHandler.restart(serverName);
    embed.setDescription(Lang.parse("commands.restart.restarted", { SERVER_NAME: serverName }));
    await interaction.editReply({ embeds: [embed] });
  }

  setParameters!: (params: {
    serverName: string
  }) => this;
}