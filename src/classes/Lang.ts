import assert from "assert";
import fs from "fs";
import path from "path";
import merge from "ts-deepmerge";
import { NullRequiredLanguageParameterError, UnknownLanguageError } from "./Errors";
import languages from "../../locales/translation.json";

export type Language = keyof typeof languages;

interface LanguageParseOptions {
  SERVER_NAME?: string
  PLAYER_COUNT?: string | number
  PLAYER_NAME?: string
  BACKUP_NAME?: string
  MESSAGE_LINK?: string,
  GAME_COMMAND?: string


  paramBolding?: boolean
}

export default abstract class Lang {
  static readonly SERVER_NAME = "%SERVER_NAME%";
  static readonly PLAYER_COUNT = "%PLAYER_COUNT%";
  static readonly PLAYER_NAME = "%PLAYER_NAME%";
  static readonly BACKUP_NAME = "%BACKUP_NAME%";

  static readonly localesPath = path.join(process.cwd(), "locales");

  static lang: Language = "en";
  static langFile: typeof languages["en"];

  static setLang(lang: Language = "en") {
    Lang.langFile = merge.withOptions({}, languages["en"], languages[lang]);
  }
  static getTranslationFilePath(lang: Language) {
    return path.join(Lang.localesPath, lang, "translation.json");
  }

  static parse(text: string, options?: LanguageParseOptions) {
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (key === key.toUpperCase()) {
          if (!key.includes("LINK")) {
            if (options.paramBolding === undefined || options.paramBolding == true) {
              value = `**${value}**`;
            }
          }
          text = text.replaceAll(`%${key}%`, value);
        }
      });
    }
    const params = text.match(/%[A-Z_]{3,}%/g);
    if (params) {
      throw new NullRequiredLanguageParameterError(params);
    }
    return text;
  }
}