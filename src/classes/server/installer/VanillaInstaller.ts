import assert from "assert";
import fs from "fs";
import path from "path";
import axios from "axios";
import GameServer from "../GameServer";
import { EulaNotAcceptedError, InstallDirectoryNotEmptyError } from "../../Errors";

// type GameVersion = `${number}.${number}${number}${"." | ""}${number}`;

interface GameVersion {
  id: string,
  type: "release" | "snapshot"
}

interface VersionManifest {
  latest: {
    release: string,
    snapshot: string
  },
  versions: {
    id: string,
    type: string,
    url: string,
    time: string,
    releaseTime: string
  }[]
}

export default class VanillaInstaller {
  installed: boolean = false;
  eula: boolean = false;
  useLogs;
  version;

  private versionManifestURL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

  // version: GameVersion | undefined;
  constructor(version: string, log = true) {
    this.version = version;
    this.useLogs = log;
  }

  /**
   * 
   * @param directory The directory where the server will be installed at
   * @throws {EulaNotAcceptedError}
   * @throws {InstallDirectoryNotEmptyError}
   * @returns {Promise<GameServer>} The server object that can be started or stopped
   */
  async install(directory: string): Promise<GameServer> {
    assert(this.eula, new EulaNotAcceptedError(this.version));

    if (!fs.existsSync(directory)) {
      await fs.promises.mkdir(directory);
    }

    assert((await fs.promises.readdir(directory)).length == 0, new InstallDirectoryNotEmptyError(this.version));

    // Accept the eula
    fs.promises.writeFile(path.join(directory, "eula.txt"), "eula=true");

    this.log("Getting version manifest...");
    var res = await axios.get(this.versionManifestURL);
    let parsedData = res.data as VersionManifest;

    this.log("Finding requested version...");
    let version = this.version == "latest" ? parsedData.latest.release : this.version;
    let versionData = parsedData.versions.find(e => e.id == version);
    assert(versionData);

    this.log("Getting the download URL...");
    var res = await axios.get(versionData.url);
    let downloadURL = res.data["downloads"]["server"]["url"];

    let fileName = `server_${version}.jar`;

    let jarFileStream = fs.createWriteStream(path.join(directory, fileName));

    this.log("Downloading jar file...");
    var res = await axios.get(downloadURL, {responseType: "stream"});

    res.data.pipe(jarFileStream);

    return new Promise((resolve) => {
      res.data.on("end", async() => {
        let server = new GameServer(`java -Xmx1024M -Xms1024M -jar ${fileName} nogui`, directory);
        server.std.on("out", e => this.log(e.data));
        server.start();
        await server.waitfor("ready");
  
        await server.stop();
  
        
        this.log("Done!");

        this.installed = true;

        resolve(server);
      });
    });
  }


  acceptEULA() {
    this.eula = true;
    return this;
  }

  log(text: string) {
    if (this.useLogs) {
      console.log(`[VanillaInstaller]: ${text}`);
    }
  }
}