import { Router } from "express";
import { ServerHandler } from "../serverHandler";
import express from "express";


const router = Router();

router.use(express.json());

router.post("/server/send-command", (req, res) => {
  const {server, command} = req.body;

  // if (!(server && command)) return res.status(400).json({code: 400});

  const gameServer = ServerHandler.getServerById(server);

  if (!gameServer) return res.status(404).json({code: 404});

  gameServer.sendGameCommand(command);

  res.json({success: true})
});

export default router;