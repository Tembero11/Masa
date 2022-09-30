import assert from "assert";
import fs from "fs";
import path from "path";

import BotConfig from "./BotConfig";
import { ServerListEntry } from "./config";
import DashSettings from "./DashSettings";

interface ConfTypes {
    dash: DashSettings
    bot: BotConfig
    servers: ServerListEntry[]
}

const confFiles: readonly (keyof ConfTypes)[] = [
    "bot",
    "servers",
    "dash"
];

interface ConfigCreationResult {
    filename: string,
    content: string,
}

export default class Conf {
    readonly CONFIG_DIRECTORY = path.join(process.cwd(), "config");

    files: Partial<ConfTypes> = {};

    getFile<T extends keyof ConfTypes>(filename: T) {
        if (!Object.hasOwn(this.files, filename)) {
            const fileData = fs.readFileSync(path.join(this.CONFIG_DIRECTORY, filename + ".json"), {
                encoding: "utf8"
            });
            this.files[filename] = JSON.parse(fileData) as ConfTypes[T];
        }
        return this.files[filename] as ConfTypes[T];
    }

    write<T extends keyof ConfTypes>(filename: T, content: ConfTypes[T]) {
        const filepath = path.join(this.CONFIG_DIRECTORY, filename + ".json");
        const data = JSON.stringify(content);
        fs.writeFileSync(filepath, data, "utf8");
    }

    async createAll(contentFn: (filename: keyof ConfTypes) => Promise<string | null>): Promise<ConfigCreationResult[]> {
        if (!fs.existsSync(this.CONFIG_DIRECTORY)) {
            fs.mkdirSync(this.CONFIG_DIRECTORY);
        }

        const result: ConfigCreationResult[] = [];

        for (const file of confFiles) {
            const filepath = path.join(this.CONFIG_DIRECTORY, file + ".json");
            if (fs.existsSync(filepath)) continue;

            const content = await contentFn(file);
            assert(content);

            fs.writeFileSync(filepath, content, "utf8");

            result.push({ filename: file, content });
        }
        return result;
    }
}