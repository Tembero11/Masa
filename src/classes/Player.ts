import assert from "assert";
import GameLiveConf from "./server/GameLiveConf";
import GameServer from "./server/GameServer";

abstract class BasePlayer {
  readonly isOnline: boolean = false;

  protected server: GameServer;
  protected liveConf: GameLiveConf;

  protected readonly username: string;

  constructor(username: string, liveConf: GameLiveConf, server: GameServer) {
    this.username = username;
    this.liveConf = liveConf;
    this.server = server;
  }

  getServer() {
    return this.server;
  }

  getUsername() {
    return this.username;
  }

  getUUID() {
    const usercache = this.liveConf.getFile("usercache");
    const uuid = usercache.find(player => player.name === this.username)?.uuid;

    assert(uuid);
    return uuid.replaceAll("-", "");
  }

  isWhitelisted() {
    const whitelist = this.liveConf.getFile("whitelist");
    const player = whitelist.find(player => player.name === this.username);

    return player ? true : false;
  }
}


export class OfflinePlayer extends BasePlayer {
  readonly isOnline = false;
  toOnlinePlayer() {
    return new OnlinePlayer(this.getUsername(), this.liveConf, this.getServer());
  }
}

export class OnlinePlayer extends BasePlayer {
  readonly isOnline = true;

  private readonly created: Date;

  constructor(username: string, liveConf: GameLiveConf, server: GameServer) {
    super(username, liveConf, server);

    this.created = new Date();
  }

  getOnlineTime() {
    return new Date(new Date().getTime() - this.created.getTime());
  }
  getJoinTime() {
    return this.created;
  }

  kickPlayer(message: string) {
    return this.server.events.kickPlayer(this, message);
  }

  performCommand(command: string) {
    this.server.sendGameCommand(`execute as ${this.username} ${command.replace(/^\//, "")}`);
  }

  giveExp(amount: number) {
    this.server.sendGameCommand(`xp add ${this.username} ${Math.floor(amount)} points`);
  }
  giveExpLevels(amount: number) {
    this.server.sendGameCommand(`xp add ${this.username} ${Math.floor(amount)} levels`);
  }
  setExp(exp: number) {
    this.server.sendGameCommand(`xp set ${this.username} ${Math.floor(exp)} points`);
  }
  setLevel(exp: number) {
    this.server.sendGameCommand(`xp set ${this.username} ${Math.floor(exp)} levels`);
  }

  sendMessage(message: string) {
    this.server.sendGameCommand(`tellraw ${this.username} "${message}"`);
  }

  toOfflinePlayer() {
    return new OfflinePlayer(this.getUsername(), this.liveConf, this.getServer())
  }
}