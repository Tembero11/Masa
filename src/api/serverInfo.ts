import { Router } from "express";
import { ServerHandler } from "../serverHandler";
import { apiResponse } from "./openServer";

const router = Router();

router.get("/server/:tag", (req, res) => {
  const gameServer = ServerHandler.getServerById(req.params.tag);
  if (!gameServer) return apiResponse(res, 404);

  res.json({
    server: gameServer.tag,
    name: gameServer.name,
    status: gameServer.isJoinable ? "online" : "offline"
  });
});

export default router;