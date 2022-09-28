import { Router } from "express";
import Masa from "../../classes/Masa";
import { NetworkError } from "../NetworkError";
import { apiResponse } from "../openServer";

const router = Router();

router.get("/server/:tag", (req, res) => {
  const gameServer = Masa.getServerByTag(req.params.tag);
  if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);


  apiResponse(res, 200, NetworkError.Ok, {
    server: gameServer.tag,
    name: gameServer.name,
    status: gameServer.isJoinable ? "online" : "offline",
    onlinePlayerCount: gameServer.getOnlinePlayersCount()
  });
});

export default router;