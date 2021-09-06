import axios from "axios";

export default class Player {
    readonly username: string;
  
    private _uuid: string | undefined;
  
    get uuid(): Promise<string> {
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
  
    constructor(username: string, uuid?: string) {
      this.username = username;
      this._uuid = uuid;
    }
  }