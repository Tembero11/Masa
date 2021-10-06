import { ChildProcessWithoutNullStreams } from "child_process";
import ConsoleReader from "./ConsoleReader";

type ServerEvent = "event";
type ServerEventListener = (event: ConsoleReader) => void;

export default class ServerCommunicator {

    private listeners: ServerListener[] = [];

    serverProcess;

    events;

    constructor(serverProcess: ChildProcessWithoutNullStreams) {
        this.serverProcess = serverProcess;

        this.events = new ServerEventEmitter(serverProcess, this);

        serverProcess.on("message", (data) => {
            this.notifyListeners(new ConsoleReader(data.toString())); 
        });
    }


    notifyListeners(event: ConsoleReader) {
        this.listeners.forEach(e => e.listener(event));
    }

    on(event: ServerEvent, listener: ServerEventListener) {
        this.listeners.push(new ServerListener(event, listener));
    }

    removeListener(listener: ServerListener) {
        this.listeners = this.listeners.filter(e => e !== listener);
    }
}

// This contains all event emit functions
class ServerEventEmitter {
    private serverProcess;
    private communicator;
    constructor(serverProcess: ChildProcessWithoutNullStreams, communicator: ServerCommunicator) {
        this.serverProcess = serverProcess;
        this.communicator = communicator;
    }

    saveGame(): Promise<Date> {
        return new Promise<Date>((res) => {
            const listener = (e: ConsoleReader) => {
                if (e.isGameSaveEvent) {
                    this.communicator.removeListener(new ServerListener("event", listener));
                    res(new Date());
                }
            }
            this.communicator.on("event", listener);
            this.serverProcess.stdin.write("save-all\n");
        });
    }
    disableAutosave() {

    }
    enableAutosave() {

    }
    stop() {

    }
}

class ServerListener {
    listener;
    event;
    constructor(event: ServerEvent, listener: ServerEventListener) {
        this.listener = listener;
        this.event = event;
    }
}