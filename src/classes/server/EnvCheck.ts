import AdmZip from "adm-zip";
import chalk from "chalk";
import { spawn } from "child_process";
import { lookpath } from "lookpath";

interface ServerVersionData {
    id: string
    name: string
    release_target: string
    world_version: number
    protocol_version: number
    pack_version: {
        resource: number
        data: number
    }
    build_time: string
    stable: boolean
}

export default abstract class EnvCheck {
    /**
     * @description Checks Java availability from the command line
     * @returns {true} if Java was found
     * @param logOutput Whether to emit the `java --version` output to `process.stdout`
     */
    static async hasJava(logOutput?: boolean): Promise<boolean> {
        const program = "java";

        const p = await lookpath(program);
        if (p) {
            return new Promise<boolean>(res => {
                try {
                    const proc = spawn(program, ["--version"]);
    
                    let output = "";
    
                    proc.stdout.on("data", (chunk) => {
                        output += (chunk as {toString: () => string;}).toString();
                    });
    
                    proc.on("exit", () => {
                        if (output.search(/^(openjdk|java)/) > -1) {
                            if (logOutput) {
                                process.stdout.write(`Java found at ${chalk.yellow`"${p}"`}\n`);
                                process.stdout.write(chalk.grey(output) + "\n");
                            }
                            res(true);
                        } else {
                            res(false);
                        }
                    });
                } catch (err) {
                    res(false);
                }
            });
        }
        return false;
    }

    static async getGameVersion(filepath: string): Promise<ServerVersionData> {
        return new Promise<ServerVersionData>((resolve, reject) => {
            const jarFile = new AdmZip(filepath);
            // Read the version.json file from the .jar server file present since snapshot 18w47b
            jarFile.readAsTextAsync("version.json", (data, err) => {
                if (!err && data) {
                    const parsedData = JSON.parse(data) as ServerVersionData;
                    resolve(parsedData);
                }else {
                    reject(err);
                }
            });
        });
    }
}