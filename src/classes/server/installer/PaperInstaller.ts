/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import axios from "axios";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import GameServer from "../GameServer";
import Installer, { VersionManifest } from "./Installer";
import ProgressBar from "./ProgressBar";

// export interface VersionManifest {
//   latest: {
//     release: string,
//     snapshot: string
//   },
//   versions: {
//     id: string,
//     type: string,
//     url: string,
//     time: string,
//     releaseTime: string
//   }[]
// }

interface PaperVersionManifest {
  project_id: "paper",
  project_name: "Paper",
  version_groups: string[]
  versions: string[]
}

export default class PaperInstaller extends Installer {

  static versionCache: VersionManifest | null = null;
  static versionManifestURL = "https://papermc.io/api/v2/projects/paper";

  async install(directory: string): Promise<any> {
    await super.install(directory);

    this.log("Getting version manifest...");
    // Find all of the versions from the API
    const manifest = await PaperInstaller.getVersions();

    this.log("Finding requested version...");
    const version = this.version == "latest" ? manifest.latest.release : this.version;
    const versionData = manifest.versions.find(e => e.id == version);
    assert(versionData);

    this.log("Getting the download URL...");
    const builds = await PaperInstaller.getBuilds(version);
    const latestBuild = builds[builds.length - 1];

    const filename = await PaperInstaller.getFilename(version, latestBuild);
    this._filename = filename;

    const downloadURL = `${PaperInstaller.versionManifestURL}/versions/${version}/builds/${latestBuild}/downloads/${filename}`;
    const jarFileStream = fs.createWriteStream(path.join(directory, filename));

    this.log("Downloading jar file...");
    const stream = (await axios.get(downloadURL, {responseType: "stream"})).data;
    stream.pipe(jarFileStream);

    return new Promise((resolve) => {
      stream.on("end", async() => {
        const server = new GameServer(`java -Xmx1024M -Xms1024M -jar ${filename} nogui`, directory, { disableRCON: true });

        process.stdout.write("Installing...");

        const progress = new ProgressBar(0, 50);

        server.std.on("out", e => {
          progress.increment();
          if (e.isDoneMessage) {
            progress.done();
            this.installed = true;
          }
          process.stdout.clearLine(-1);
          process.stdout.cursorTo(0);

          if (!server.isJoinable) {
            process.stdout.write(
              `[PaperInstaller]: Installing... ${progress.toString()} ${e.isDoneMessage ? " | Done!\n" : ""}`
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
    if (PaperInstaller.versionCache) {
      return PaperInstaller.versionCache;
    }
    const res = (await axios.get(PaperInstaller.versionManifestURL)).data as PaperVersionManifest;
    const versions: VersionManifest = {
      latest: {
        // Get the latest version from the versions list
        release: res.versions[res.versions.length - 1],
      },
      versions: res.versions.map(e => {return {
        id: e,
        type: "release",
      }})
    }

    return versions;
  }

  static async getBuilds(version: string) {
    const url = `${PaperInstaller.versionManifestURL}/versions/${version}`;
    const res = await axios.get(url);
    
    assert(res.data["version"] == version);
    return res.data["builds"] as number[];
  }

  static async getFilename(version: string, build: number) {
    const url = `${PaperInstaller.versionManifestURL}/versions/${version}/builds/${build}`;
    const res = await axios.get(url);
    assert(res.data["version"] == version);

    const filename = res.data["downloads"]["application"]["name"] as string;
    return filename;
  }

  static clearCache = () => PaperInstaller.versionCache = null;

  log(text: string): void {
    if (this.useLogs) {
      console.log(`[PaperInstaller]: ${text}`);
    }
  }
}