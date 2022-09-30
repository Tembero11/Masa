import fs from "fs";
import { PropertyStringPath } from "property-string-path";
import path from "path";
import merge from "ts-deepmerge";
import { NullRequiredLanguageParameterError } from "./Errors";
import en from "../../locales/en.json";
import languageIndex from "../../locales/index.json";
import Masa from "./Masa";

export type Language = keyof typeof languageIndex.languages;
export type DateFormatType = keyof typeof en["dateFormat"];

interface LanguageParseOptions {
  SERVER_NAME?: string
  PLAYER_COUNT?: string | number
  PLAYER_NAME?: string
  BACKUP_NAME?: string
  MESSAGE_LINK?: string,
  GAME_COMMAND?: string


  paramBolding?: boolean
}

export type LangPath = PropertyStringPath<typeof en["translations"], "">;

export default abstract class Lang {
  static readonly SERVER_NAME = "%SERVER_NAME%";
  static readonly PLAYER_COUNT = "%PLAYER_COUNT%";
  static readonly PLAYER_NAME = "%PLAYER_NAME%";
  static readonly BACKUP_NAME = "%BACKUP_NAME%";

  static readonly localesPath = path.join(process.cwd(), "locales");

  static lang: Language = "en";
  static langFile: typeof en;

  static monthsAndDays: [string, string][];

  static setLocale(lang: Language = "en") {
    const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "locales", lang + ".json"), "utf8")) as typeof en;
    Lang.langFile = merge.withOptions({}, en, file);

    Lang.monthsAndDays = [
      ...Object.entries(Lang.langFile.translations.months.long),
      ...Object.entries(Lang.langFile.translations.months.short),
      ...Object.entries(Lang.langFile.translations.days.long),
      ...Object.entries(Lang.langFile.translations.days.short),
    ];
  }

  static parse(path: LangPath, options?: LanguageParseOptions) {
    // Parse language path
    let text: string;
    if (Masa.getConf().getFile("bot").developer?.skipLanguageParsing) {
      text = path as string;
    }else {
      let current: any = Lang.langFile["translations"];
      path.split(".").forEach(key => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        current = current[key]
      });

      text = current as string;
    }
    // Parse variables in text
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (key === key.toUpperCase()) {
          if (!key.includes("LINK")) {
            if (options.paramBolding === undefined || options.paramBolding == true) {
              value = `**${value as string | number}**`;
            }
          }
          text = text.replaceAll(`%${key}%`, (value as string | number).toString());
        }
      });
    }
    const params = text.match(/%[A-Z_]{3,}%/g);
    if (params) {
      throw new NullRequiredLanguageParameterError(params);
    }
    return text;
  }

  static translateDateAndTime(text: string) {
    Lang.monthsAndDays.forEach(([key, value]) => {
      text = text.replaceAll(new RegExp(key, "gi"), value);
    });
    return text;
  }

  static getDateOrTimeFormat = (type: DateFormatType) => Lang.langFile.dateFormat[type];
}