import assert from "assert";
import fs from "fs";
import path from "path";
import axios from "axios";
import GameServer from "../GameServer";
import { EulaNotAcceptedError, InstallDirectoryNotEmptyError } from "../../Errors";
import { ConsoleColor } from "../../../helpers";

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

  static versionCache: VersionManifest | null = null;

  static versionManifestURL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

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
    let manifest = await VanillaInstaller.getVersions();

    this.log("Finding requested version...");
    let version = this.version == "latest" ? manifest.latest.release : this.version;
    let versionData = manifest.versions.find(e => e.id == version);
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

        process.stdout.write("Installing...");


        let loadingProgress = 0;
        const maxProgress = 50;

        server.std.on("out", e => {
          loadingProgress++;
          if (loadingProgress > maxProgress) {
            loadingProgress = maxProgress;
          }
          if (e.isDoneMessage) {
            loadingProgress = maxProgress;
            this.installed = true;
          }
          process.stdout.clearLine(-1);
          process.stdout.cursorTo(0);

          let progressArray = new Array(loadingProgress - 1).fill(" ");
          // progressArray.push(">");

          let progressLeftArray = new Array(maxProgress - loadingProgress).fill(" ");

          if (!server.isJoinable) {
            process.stdout.write(
              `[VanillaInstaller]: Installing... [${ConsoleColor.BgGreen}${progressArray.join("")}${ConsoleColor.Reset}${progressLeftArray.join("")}] ${e.isDoneMessage ? "Done!\n" : ""}`
            );
          }
        });

        server.start();
        await server.waitfor("ready");
        

        await server.stop();

        resolve(server);
      });
    });
  }

  static async getVersions() {
    if (VanillaInstaller.versionCache) {
      return VanillaInstaller.versionCache;
    }
    let data = (await axios.get(VanillaInstaller.versionManifestURL)).data as VersionManifest;
    VanillaInstaller.versionCache = data;
    return data;
  }
  static clearCache = () => VanillaInstaller.versionCache = null;


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