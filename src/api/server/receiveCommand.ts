import { Router } from "express";
import express from "express";
import { apiResponse } from "../openServer";
import { NetworkError } from "../NetworkError";
import Masa from "../../classes/Masa";


const router = Router();

router.use(express.json());

router.post("/server/:tag/send-command", (req, res) => {
  const { command } = req.body;
  const { tag } = req.params;

  if (!command) return apiResponse(res, 400, NetworkError.GameCommandMissing);

  const gameServer = Masa.getServerByTag(tag);

  if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

  gameServer.sendGameCommand(command);

  res.json({success: true})
});

export default router;