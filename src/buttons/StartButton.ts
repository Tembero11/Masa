import assert from "assert";
import { MessageButtonStyleResolvable, ButtonInteraction, MessageEmbed } from "discord.js";
import Lang from "../classes/Lang";
import { ServerHandler } from "../serverHandler";
import { GenericButton } from "./GenericButton";

export class StartButton extends GenericButton {
  readonly customId = "server_start";
  readonly rawLabel = "buttons.start";
  readonly style = "PRIMARY";


  handler = async(params: any, interaction: ButtonInteraction) => {
    const { serverName } = params;
    assert(serverName);
    
    let embed = new MessageEmbed();

    await ServerHandler.start(serverName);
    embed.setDescription(Lang.parse(Lang.langFile.commands.start.started, { SERVER_NAME: serverName }));
    await interaction.editReply({ embeds: [embed] });
  }

  setParameters!: (params: {
    serverName: string
  }) => this;
}