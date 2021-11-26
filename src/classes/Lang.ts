import assert from "assert";
import fs from "fs";
import path from "path";
import merge from "ts-deepmerge";
import { UnknownLanguageError } from "./Errors";
import languages from "../../locales/translation.json";

export type Language = keyof typeof languages;


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

  static parse(text: string, options?: {SERVER_NAME?: string, PLAYER_COUNT?: string | number, PLAYER_NAME?: string, BACKUP_NAME?: string}) {
    if (text.includes(Lang.SERVER_NAME)) {
      assert(options && options.SERVER_NAME);
      text = text.replaceAll(Lang.SERVER_NAME, options.SERVER_NAME);
    }
    if (text.includes(Lang.PLAYER_COUNT)) {
      assert(options && options.PLAYER_COUNT);
      text = text.replaceAll(Lang.PLAYER_COUNT, options.PLAYER_COUNT.toString());
    }
    if (text.includes(Lang.PLAYER_NAME)) {
      assert(options && options.PLAYER_NAME);
      text = text.replaceAll(Lang.PLAYER_NAME, options.PLAYER_NAME);
    }
    if (text.includes(Lang.BACKUP_NAME)) {
      assert(options && options.BACKUP_NAME);
      text = text.replaceAll(Lang.BACKUP_NAME, options.BACKUP_NAME);
    }
    return text;
  }
}