import { createBackupsFolder } from "./backup";
import { createDateTimeString, parseDateTimeString, serverDir } from "./helpers";
import fs from "fs";
import { Console } from "console";

const setup = () => {
    createBackupsFolder();
    createServerFolder();
}

const createServerFolder = async() => {
    if (!fs.existsSync(serverDir)) {
        console.log("Server folder not found! Creating...");

        await fs.promises.mkdir(serverDir);
    }else {
        console.log("Server folder found! Using...");
    }
}

export default setup;