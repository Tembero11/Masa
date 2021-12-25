import assert from "assert";
import { ButtonInteraction, MessageButton, MessageButtonStyleResolvable } from "discord.js"
import Lang, { LangPath } from "../classes/Lang";

export abstract class GenericButton {
  abstract readonly customId: string
  abstract readonly labelLangPath: LangPath
  abstract readonly style: MessageButtonStyleResolvable;

  isGlobal;

  /**
   * 
   * @param isGlobal Whether the button instance is used in the global array
   */
  constructor(isGlobal?: boolean) {
    this.isGlobal = isGlobal;
  }

  abstract handler: (params: any, interaction: ButtonInteraction) => Promise<void>;

  protected params: any;

  private generatedCustomId: string | undefined;

  getMessageButton = (disabled: boolean = false) => {
    assert(this.params);
    assert(!this.isGlobal);

    return new MessageButton()
    .setCustomId(this.generatedCustomId || this.generateCustomId())
    .setLabel(Lang.parse(this.labelLangPath))
    .setStyle(this.style)
    .setDisabled(disabled);
  }

  generateCustomId() {
    this.generatedCustomId = this.customId + ":" + JSON.stringify(this.params);
    return this.generatedCustomId;
  }

  setParameters(params: {[key: string]: any}): this {
    assert(!this.isGlobal);
    this.params = params;
    return this;
  }
}