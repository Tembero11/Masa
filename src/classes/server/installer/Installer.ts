import assert from "assert";
import fs from "fs";
import path from "path";
import { EulaNotAcceptedError, InstallDirectoryNotEmptyError } from "../../Errors";

export interface VersionManifest {
  latest: {
    release: string,
    snapshot?: string
  },
  versions: {
    id: string,
    type: string,
    url?: string,
    time?: string,
    releaseTime?: string
  }[]
}


export default abstract class Installer {
  installed: boolean = false;
  eula: boolean = false;
  useLogs: boolean = false;
  version: string;

  protected _filename: string | undefined;

  get filename(): string {
    assert(this.installed && this._filename);
    return this._filename;
  }

  constructor(version: string, log = true) {
    this.useLogs = true;
    this.version = version;
  }

  async install(directory: string): Promise<any> {
    assert(this.eula, new EulaNotAcceptedError(this.version));

    if (!fs.existsSync(directory)) {
      await fs.promises.mkdir(directory);
    }

    assert((await fs.promises.readdir(directory)).length == 0, new InstallDirectoryNotEmptyError(this.version));

    // Accept the eula
    await fs.promises.writeFile(path.join(directory, "eula.txt"), "eula=true");
  };
  acceptEULA() {
    this.eula = true;
    return this;
  }
  abstract log(text: string): void;
}