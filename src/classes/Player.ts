import axios from "axios";
import ServerCommunicator from "./server/ServerCommunicator";

export default class Player {
    readonly username: string;
  
    private _uuid: string | undefined;
    readonly server;
  
    getUUID(): Promise<string> {
      return new Promise<string>((res, rej) => {
        if (!this._uuid) {
          axios.get(`https://api.mojang.com/users/profiles/minecraft/${this.username}`).then((response) => {
            if (typeof response.data["id"] == "string") {
              res(response.data["id"]);
            } else {
              rej("UUID was invalid.");
            }
          }).catch(reason => rej(reason));
        } else {
          res(this._uuid);
        }
      });
    }

    kickPlayer(message: string) {
      return this.server.events.kickPlayer(this, message);
    }

    performCommand(command: string) {
      this.server.std.emit("in", `execute as ${this.username} ${command.replace(/^\//, "")}\n`);
    }

    giveExp(amount: number) {
      this.server.std.emit("in", `xp add ${this.username} ${Math.floor(amount)} points\n`);
    }
    giveExpLevels(amount: number) {
      this.server.std.emit("in", `xp add ${this.username} ${Math.floor(amount)} levels\n`);
    }
    setExp(exp: number) {
      this.server.std.emit("in", `xp set ${this.username} ${Math.floor(exp)} points\n`);
    }
    setLevel(exp: number) {
      this.server.std.emit("in", `xp set ${this.username} ${Math.floor(exp)} levels\n`);
    }

    sendMessage(message: string) {
      this.server.std.emit("in", `tellraw ${this.username} "${message}"\n`);
    }
  
    constructor(username: string, server: ServerCommunicator, uuid?: string) {
      this.username = username;
      this._uuid = uuid;
      this.server = server;
    }
  }