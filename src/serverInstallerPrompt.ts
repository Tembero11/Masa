/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import inquirer from "inquirer";
import fs from "fs"
import assert from "assert";
import Installer, { VersionManifest } from "./classes/server/installer/Installer";
import PaperInstaller from "./classes/server/installer/PaperInstaller";
import VanillaInstaller from "./classes/server/installer/VanillaInstaller";
import { RawServerMetadata, ServerMetadata } from "./conf/ServerMetadata";
import { normalizeFilePath } from "./helpers";


// this code is HORRRIBLE and needs a cleanup

export async function serverInstallerPrompt(serverList: ServerMetadata[]): Promise<RawServerMetadata & {dir: string} | undefined> {
  const options: { version: string, dir: string, [key: string]: any } = {version: "", dir: ""};

  options.willInstall = (await inquirer.prompt(
      [{
          message: "No servers found. Would you like to install a new one?",
          name: "willInstall",
          type: "confirm",
      }],
  )).willInstall as boolean;

  if (!options.willInstall) {
      console.log("No servers to take care of. MASA will now exit :(");
      process.exit();
  }

  options.serverType = (await inquirer.prompt([{
      message: "What kind of server would you like to install?",
      name: "serverType",
      type: "list",
      choices: [
          { name: "Vanilla" },
          { name: "Paper" },
      ]
  }])).serverType;

  options.version = (await inquirer.prompt([{
      message: "What version do you want to play?",
      name: "version",
      type: "autocomplete",
      source: async function (answersSoFar: any, input: string) {
          input = input || "latest";
          let manifest: VersionManifest | null = null;
          switch (options.serverType) {
              case "Vanilla":
                  manifest = await VanillaInstaller.getVersions();
                  break;
              case "Paper":
                  manifest = await PaperInstaller.getVersions();
                  break;
              default:
                  break;
          }
          if (manifest) {
              if (input.startsWith("latest")) {
                  input = manifest.latest.release;
              }
  
              return manifest.versions
              .filter((value) => value.id.startsWith(input) && (value.type == "release"))
              .map((e) => e.id);
          }
      }
  }])).version as string;

  options.dir = (await inquirer.prompt([{
      message: "Where will the server be installed? (path to folder)",
      name: "dir",
      type: "input",
      validate: async (input) => {
          if (fs.existsSync(input as string)) {
              const contents = await fs.promises.readdir(input as string);
              if (contents.length != 0) {
                  return "Directory not empty!";
              }
          }
          return true;
      }
  }])).dir as string;

  options.name = (await inquirer.prompt([{
      message: "What should we call the server?",
      name: "name",
      type: "input",
      validate: (input) => {
          const server = serverList.find((e => e.name == input));
          if (server) {
              return "Server name is taken";
          }
          return true;
      }
  }])).name as string;

  const eula = (await inquirer.prompt([{
      message: "Do you accept the End User License Agreement (EULA) (https://account.mojang.com/documents/minecraft_eula)?",
      name: "eula",
      type: "confirm",
  }])).eula as boolean;

  if (options.willInstall && eula) {
      let installer: null | Installer = null;
      switch (options.serverType) {
          case "Vanilla":
              installer = new VanillaInstaller(options.version);
              break;
          case "Paper":
              installer = new PaperInstaller(options.version);
              break;
          default:
              break;
      }

      assert(installer);

      await installer.acceptEULA().install(options.dir);

      return {
          name: options.name as string,
          command: `java -Xmx1024M -Xms1024M -jar ${installer.filename} nogui`,
          description: "",
          dir: normalizeFilePath(options.dir),
      };
  }
}