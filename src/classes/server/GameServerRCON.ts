import assert from "assert";
import RCON from "rcon-srcds";
import GameServer from "./GameServer";

export default class GameServerRCON {
    gameServer: GameServer;
    private host: string;
    private port: number;
    private password: string;
  
    
    get isConnected(): boolean {
      return this.rawRcon?.isAuthenticated() || false;
    }
    
  
    protected rawRcon: RCON | undefined;
  
    constructor(gameServer: GameServer, host: string, port: number, password: string) {
      this.gameServer = gameServer;
      this.host = host;
      this.port = port;
      this.password = password;
    }
  
    async establishConnection(): Promise<boolean> {
      assert(!this.isConnected, "establishConnection got called when RCON is already connected!");
  
      this.rawRcon = new RCON({ host: this.host, port: this.port, timeout: 4000 });
      
      try {
        await this.rawRcon.authenticate(this.password);
        // If the server crashes Masa doesn't crash
        this.rawRcon.connection.on("error", async err => console.log(err));
        this.rawRcon.connection.on("close", () => console.log("RCON CLOSED"))
        return true;
      } catch (err) {
        return false;
      }
    }

    async disconnect() {
        this.rawRcon?.disconnect();
    }
  
    async sendGameCommand(gameCommand: string) {
      assert(this.isConnected, "RCON is not connected!");
  
      return await this.rawRcon!.execute(gameCommand);
    }
  }