import { config } from "../../index";
import { io, Socket } from "socket.io-client";

const server = "http://127.0.0.1:3000/";



export const socketConnect = async() => {
  return new Promise<Socket>((res) => {
    const socket = io(server, {
      query: {
        token: config["centralToken"]
      }
    });

    socket.on("connect", () => {
      console.log(socket.id);

      socket.emit("lol", {data: "hello"})

      res(socket);
    });

    
  })
}