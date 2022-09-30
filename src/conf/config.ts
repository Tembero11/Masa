import path from "path";
import fs from "fs";
import chalk from "chalk";
import { RawServerMetadata } from "./ServerMetadata";


export interface ServerListEntry {
  dir: string
  tag: string
  /**
   * Replaces the default masa.json file name with this value
   */
  index?: string
}





export const prettyPrint = (data: object) => {
  return JSON.stringify(data, null, 2);
}

export async function writeServerMetadata(serverDir: string, metadata: RawServerMetadata, index = "masa.json") {
  await fs.promises.writeFile(path.join(serverDir, index), prettyPrint(metadata), {encoding: "utf8"});
}
export async function readServerMetadata(serverDir: string, index = "masa.json") {
  return JSON.parse(await fs.promises.readFile(path.join(serverDir, index), {encoding: "utf8"})) as RawServerMetadata;
}