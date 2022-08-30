import GameServer from "../GameServer";
import { BackupManager, BackupManagerOptions } from "./BackupManager";

interface GameServerBackupManagerOptions extends BackupManagerOptions {
  shouldDisableAutosave?: boolean
}

export default class GameServerBackupManager extends BackupManager {
  readonly server: GameServer;

  shouldDisableAutosave: boolean;

  constructor(server: GameServer, dest: string, options?: GameServerBackupManagerOptions) {
    super(server.dir, dest, options);

    this.shouldDisableAutosave = options?.shouldDisableAutosave || false;

    this.server = server;
  }
  async prepareForBackup() {
    if (this.server.isJoinable) {
      if (this.shouldDisableAutosave) {
        await this.server.events.disableAutosave();
      }
      await this.server.events.saveGame();
    }
  }
  async afterBackup() {
    if (this.server.isJoinable && this.shouldDisableAutosave) {
      await this.server.events.enableAutosave();
    }
  }

  async prepareForRevert() {
    if (this.server.hasStreams) {
      await this.server.stop();
    }
  }
}