import GameServer from "./GameServer";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import assert from "assert";

const WATCHED_FILES = [
    "usercache.json",
    "whitelist.json",
    "eula.txt",
    "ops.json",
    "banned-ips.json",
    "banned-players.json"
]

export interface FilePlayerEntry {
    name: string
    uuid: string
}
export type UsercacheItem = FilePlayerEntry & { expiresOn: string }

export default class GameLiveConf {
    server: GameServer;

    public get dir(): string {
        return this.server.dir;
    }

    private watcher;

    isLoaded: boolean = false;

    constructor(server: GameServer) {
        this.server = server;

        this.watcher = chokidar.watch(this.dir);

        this.watcher.on("change", (filename, stats) => this.updateFile(filename, stats));

        fs.readdirSync(this.dir).forEach(filename => {
            if (WATCHED_FILES.includes(filename)) {
                const filepath = path.join(this.dir, filename);
                this.updateFile(filepath, fs.statSync(filepath));
            }
        });

        this.isLoaded = true;

        console.log("files", this.files);
    }

    protected updateFile(filepath: string, stats?: fs.Stats) {
        if (!stats) return;
        const mtime = new Date(stats.mtime);

        const parsedPath = path.parse(filepath);

        if (Object.hasOwnProperty.call(this.files, parsedPath.name) && this.files[parsedPath.name].mtime.toISOString() === mtime.toISOString()) return;

        if (WATCHED_FILES.includes(parsedPath.base)) {
            console.log("CHANGE", filepath);
            const data = fs.readFileSync(filepath, { encoding: "utf8" });

            // All json files follow the same pattern of a { FilePlayerEntry }
            if (parsedPath.ext == ".json") {
                this.files[parsedPath.name] = {
                    mtime,
                    data: this.parseFilePlayerEntries(data)
                }
            }
        }
    }


    files: { [filename: string]: { mtime: Date, data: any } } = {}

    isEulaAccepted() {
        assert(this.isLoaded);
        return /^eula {0,}= {0,}true/.test(this.files["eula"].data);
    }

    /**
     * 
     * @param filename A filename with no extension.
     */
    getFile(filename: string) {
        assert(Object.hasOwnProperty.call(this.files, filename));

        return this.files[filename].data;
    }


    private parseFilePlayerEntries(data: string): FilePlayerEntry[] {
        try {
            const parsed = JSON.parse(data);
            return parsed;
        } catch (err) {
            return []
        }
    }
}