import { assert } from "console";
import fs from "fs";
import path from "path";
import merge from "ts-deepmerge";
import { UnknownLanguageError } from "./Errors";

export type Language = "en" | "fi";

interface TranslationFile {
  name: string
  common: {
    serverNotFound: string,
    unknownErr: string
  },
  buttons: {
    start: string
    stop: string
    restart: string
  },
  commands: {
    backup: {
      backupCreated: string
      backupsNotEnabled: string
      listOfUserBackups: string
      listOfAutoBackups: string
      latestBackupHeader: string
      latestBackupDesc: string
      latestAutoBackupHeader: string
      latestAutoBackupDesc: string
      latestUserBackupHeader: string
      latestUserBackupDesc: string

      userHeader: string
      autoHeader: string
      backupsListed: string
      author: string
      created: string
      ID: string
      description: string
    },
    start: {
      attemptingStart: string
      started: string
      alreadyOnline: string
      alreadyStarting: string
    },
    stop: {
      attemptingStop: string
      stopped: string
      alreadyOffline: string
    },
    restart: {
      attemptingRestart: string
      restarted: string
    },
    help: {
      listOfCommands: string
      helpDesc: string
    },
    status: {
      serverStatusHeader: string
      allOperational: string
      operational: string
      serverOffline: string
      serverOnline: string
      serverStarting: string
      serverStopping: string
      serverWithPlayer: string
      serverWithPlayers: string
      noPlayers: string
      playersOnline: string
    }
  }
}


export default abstract class Lang {
  static readonly SERVER_NAME = "%SERVER_NAME%";
  static readonly PLAYER_COUNT = "%PLAYER_COUNT%";
  static readonly PLAYER_NAME = "%PLAYER_NAME%";
  static readonly BACKUP_NAME = "%BACKUP_NAME%";

  static readonly localesPath = path.join(process.cwd(), "locales");

  static lang: Language = "en";
  static readonly enTranslation = JSON.parse(fs.readFileSync(path.join(Lang.localesPath, "en", "translation.json"), "utf8")) as TranslationFile;
  static langFile: TranslationFile = Lang.enTranslation;

  static setLang(lang: Language = "en") {
    Lang.lang = lang;
    const fileloc = Lang.getTranslationFilePath(lang);
    assert(fs.existsSync(fileloc), new UnknownLanguageError(lang));
    const content = JSON.parse(fs.readFileSync(fileloc, "utf8")) as TranslationFile;
    Lang.langFile = merge.withOptions({}, Lang.enTranslation, content);
  }
  static getTranslationFilePath(lang: Language) {
    return path.join(Lang.localesPath, lang, "translation.json");
  }



  static readonly common = {
    serverNotFound: (serverName: string) => Lang.langFile.common.serverNotFound.replaceAll(Lang.SERVER_NAME, serverName),
    unknownErr: () => Lang.langFile.common.unknownErr
  }

  static buttons = {
    start: () => Lang.langFile.buttons.start,
    stop: () => Lang.langFile.buttons.stop,
    restart: () => Lang.langFile.buttons.restart,
  }

  static readonly backups = {
    backupsNotEnabled: (serverName: string) => Lang.langFile.commands.backup.backupsNotEnabled.replaceAll(Lang.SERVER_NAME, serverName),
    backupCreated: (backupName: string) => Lang.langFile.commands.backup.backupCreated.replaceAll(Lang.BACKUP_NAME, backupName),
    listOfUserBackups: () => Lang.langFile.commands.backup.listOfUserBackups,
    listOfAutoBackups: () => Lang.langFile.commands.backup.listOfAutoBackups,
    latestBackupHeader: () => Lang.langFile.commands.backup.latestBackupHeader,
    latestBackupDesc: () => Lang.langFile.commands.backup.latestBackupDesc,
    latestAutoBackupHeader: () => Lang.langFile.commands.backup.latestAutoBackupHeader,
    latestAutoBackupDesc: () => Lang.langFile.commands.backup.latestAutoBackupDesc,
    latestUserBackupHeader: () => Lang.langFile.commands.backup.latestUserBackupHeader,
    latestUserBackupDesc: () => Lang.langFile.commands.backup.latestUserBackupDesc,

    userHeader: () => Lang.langFile.commands.backup.userHeader,
    autoHeader: () => Lang.langFile.commands.backup.autoHeader,
    backupsListed: () => Lang.langFile.commands.backup.backupsListed,

    author: () => Lang.langFile.commands.backup.author,
    created: () => Lang.langFile.commands.backup.created,
    ID: () => Lang.langFile.commands.backup.ID,
    description: () => Lang.langFile.commands.backup.description
  }
  static readonly start = {
    attemptingStart: (serverName: string) => Lang.langFile.commands.start.attemptingStart.replaceAll(Lang.SERVER_NAME, serverName),
    started: (serverName: string) => Lang.langFile.commands.start.started.replaceAll(Lang.SERVER_NAME, serverName),
    alreadyOnline: (serverName: string) => Lang.langFile.commands.start.alreadyOnline.replaceAll(Lang.SERVER_NAME, serverName),
    alreadyStarting: (serverName: string) => Lang.langFile.commands.start.alreadyStarting.replaceAll(Lang.SERVER_NAME, serverName)
  }
  static readonly stop = {
    attemptingStop: (serverName: string) => Lang.langFile.commands.stop.attemptingStop.replaceAll(Lang.SERVER_NAME, serverName),
    stopped: (serverName: string) => Lang.langFile.commands.stop.stopped.replaceAll(Lang.SERVER_NAME, serverName),
    alreadyOffline: (serverName: string) => Lang.langFile.commands.stop.alreadyOffline.replaceAll(Lang.SERVER_NAME, serverName),
  }
  static readonly restart = {
    attemptingRestart: (serverName: string) => Lang.langFile.commands.restart.attemptingRestart.replaceAll(Lang.SERVER_NAME, serverName),
    restarted: (serverName: string) => Lang.langFile.commands.restart.restarted.replaceAll(Lang.SERVER_NAME, serverName),
  }
  static readonly help = {
    listOfCommands: () => Lang.langFile.commands.help.listOfCommands,
    helpDesc: () => Lang.langFile.commands.help.helpDesc,
  }
  static readonly status = {
    serverStatusHeader: () => Lang.langFile.commands.status.serverStatusHeader,
    allOperational: () => Lang.langFile.commands.status.allOperational, 
    operational: () => Lang.langFile.commands.status.operational,
    serverOffline: (serverName: string) => Lang.langFile.commands.status.serverOffline.replaceAll(Lang.SERVER_NAME, serverName),
    serverOnline: (serverName: string) => Lang.langFile.commands.status.serverOnline.replaceAll(Lang.SERVER_NAME, serverName),
    noPlayers: () => Lang.langFile.commands.status.noPlayers,
    playersOnline: (playerCount: string | number) => Lang.langFile.commands.status.playersOnline.replaceAll(Lang.PLAYER_COUNT, playerCount.toString()),
    serverStarting: (serverName: string) => Lang.langFile.commands.status.serverStarting.replaceAll(Lang.SERVER_NAME, serverName),
    serverStopping: (serverName: string) => Lang.langFile.commands.status.serverStopping.replaceAll(Lang.SERVER_NAME, serverName),
    serverWithPlayer: (serverName: string, playerName: string) => Lang.langFile.commands.status.serverWithPlayer
    .replaceAll(Lang.SERVER_NAME, serverName)
    .replaceAll(Lang.PLAYER_NAME, playerName),
    serverWithPlayers: (serverName: string, playerCount: string | number) => Lang.langFile.commands.status.serverWithPlayers
    .replaceAll(Lang.SERVER_NAME, serverName)
    .replaceAll(Lang.PLAYER_COUNT, playerCount.toString()),
  }
}