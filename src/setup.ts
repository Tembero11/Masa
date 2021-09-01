import { createBackupsFolder } from "./backup";
import { createDateTimeString, parseDateTimeString } from "./helpers";

const setup = () => {
    createBackupsFolder();

    console.log(parseDateTimeString(createDateTimeString()))
}

export default setup;