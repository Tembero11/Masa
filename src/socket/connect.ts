import { config } from "../../index";
import { io, Socket } from "socket.io-client";
import { lastLines } from "../serverHandler";

const server = "http://127.0.0.1:3000/";

export enum SocketListenEvents {
  GetConsole = "GetConsole"
}

export enum SocketEmitEvents {
  SendConsole = "SendConsole",
  Status = "Status"
}

export const socketConnect = async() => {
  return new Promise<Socket>((res) => {
    const socket = io(server, {
      query: {
        token: config["centralToken"]
      }
    });

    socket.on("connect", () => {
      console.log(socket.id);

      res(socket);
    });

    socket.on(SocketListenEvents.GetConsole, () => {
      socket.emit(SocketEmitEvents.SendConsole, lastLines);
    });
  })
}