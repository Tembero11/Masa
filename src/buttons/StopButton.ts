import assert from "assert";
import { MessageButtonStyleResolvable, ButtonInteraction, MessageEmbed } from "discord.js";
import Lang from "../classes/Lang";
import { ServerHandler } from "../serverHandler";
import { GenericButton } from "./GenericButton";

export class StopButton extends GenericButton {
  readonly customId = "server_stop";
  readonly rawLabel = "buttons.stop";
  readonly style = "DANGER";


  handler = async(params: any, interaction: ButtonInteraction) => {
    const { serverName } = params;
    assert(serverName);
    
    let embed = new MessageEmbed();

    await ServerHandler.stop(serverName);
    embed.setDescription(Lang.parse(Lang.langFile.commands.stop.stopped, { SERVER_NAME: serverName }));
    await interaction.editReply({ embeds: [embed] });
  }

  setParameters!: (params: {
    serverName: string
  }) => this;
}