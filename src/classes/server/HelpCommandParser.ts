import GameServer from "./GameServer";

export default class HelpCommandParser {
    server;
    constructor(server: GameServer) {
        this.server = server;
    }

    parse(data: string) {
        const commandList = data.split("/").filter(e => e);

        const parsedCommandList: {
            name: string
            args: any[]
        }[] = [];

        for (const command of commandList) {
            const name = this.getCommandName(command);
            const args = this.getCommandArgs(command);
            parsedCommandList.push({ name, args })
        }

        return parsedCommandList;
    }

    getCommandName(rawGameCommand: string) {
        const firstSpaceChar = rawGameCommand.indexOf(" ");
        if (firstSpaceChar > -1) {
            return rawGameCommand.substring(0, firstSpaceChar);
        }
        return rawGameCommand;
    }
    getCommandArgs(rawGameCommand: string) {
        const rawArgsList = rawGameCommand.split(" ").slice(1);
        const parsedArgumentList: {values: string[]}[] = []

        for (const rawArgument of rawArgsList) {
            if (this.isTypedArgument(rawArgument)) {
                parsedArgumentList.push({ values: this.getArgumentTypes(rawArgument) });
            }
        }
        return parsedArgumentList;
    }

    // getArgument(rawArgument: string) {
    //     if (rawArgument)
    // }

    isOptionalArgument(rawArgument: string) {
        return /^\[.{1,}\]$/.test(rawArgument);
    }
    isTypedArgument(rawArgument: string) {
        return rawArgument.startsWith("(") || (rawArgument.startsWith("[") && rawArgument.includes("|"));
    }
    getArgumentTypes(rawArgument: string) {
        return rawArgument.substring(1, rawArgument.length - 1).split("|");
    }
}