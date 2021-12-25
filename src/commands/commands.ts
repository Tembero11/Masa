import {PingCommand} from "./ping";
import {StatusCommand} from "./status";
import {BackupCommand} from "./backup";
import {BackupsCommand} from "./backups";
import {HelpCommand} from "./help";
import {RestartCommand} from "./restart";
import {StartCommand} from "./start";
import {StopCommand} from "./stop";
import {LatestCommand} from "./latest";
import {ExecuteCommand} from "./execute";
import Command from "./general";

export default Object.freeze([
  new PingCommand(),
  new StatusCommand(),
  new BackupCommand(),
  new BackupsCommand(),
  new HelpCommand(),
  new RestartCommand(),
  new StartCommand(),
  new StopCommand(),
  new LatestCommand(),
  new ExecuteCommand()
].reduce((map, obj) => map.set(obj.name, obj), new Map<string, Command>()));