import { Router } from "express";
import { ServerHandler } from "../serverHandler";
import express from "express";
import { apiResponse } from "./openServer";


const router = Router();

router.use(express.json());

router.post("/server/send-command", (req, res) => {
  const {server, command} = req.body;

  // if (!(server && command)) return res.status(400).json({code: 400});

  const gameServer = ServerHandler.getServerById(server);

  if (!gameServer) return apiResponse(res, 404);

  gameServer.sendGameCommand(command);

  res.json({success: true})
});

export default router;