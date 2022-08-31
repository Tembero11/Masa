import { Router } from "express";
import { ServerHandler } from "../serverHandler";

const router = Router();

router.get("/server/:tag", (req, res) => {
  const gameServer = ServerHandler.getServerById(req.params.tag);
  if (!gameServer) return res.status(404).json({code: 404});

  res.json({
    server: gameServer.tag,
    name: gameServer.name,
    status: gameServer.isJoinable ? "online" : "offline"
  });
});

export default router;