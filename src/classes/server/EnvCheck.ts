import chalk from "chalk";
import { spawn } from "child_process";
import { lookpath } from "lookpath";

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
            return new Promise<boolean>((res, rej) => {
                try {
                    const proc = spawn(program, ["--version"]);
    
                    let output = "";
    
                    proc.stdout.on("data", (chunk) => {
                        output += chunk.toString();
                    });
    
                    proc.on("exit", (code) => {
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
}