import { Router } from "express";
import { OfflinePlayer, OnlinePlayer } from "../../classes/Player";
import { ServerHandler } from "../../serverHandler";
import { NetworkError } from "../NetworkError";
import { apiResponse, fromTo } from "../openServer";

const router = Router();

function playerToSendableObject(player: OnlinePlayer | OfflinePlayer) {
    return {
        username: player.getUsername(),
        uuid: player.getUUID(),
        isOnline: player.isOnline,
        ...(function() {
            if (!player.isOnline) return {}
           return {
                joinTime: player.getJoinTime()
           } 
        })()
    }
}

router.get("/server/:tag/players/online", (req, res) => {
    const { from, to } = fromTo(req, 10);
    if (!(from || to)) return apiResponse(res, 400, NetworkError.InvalidRange);

    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

    const resBody = gameServer.getOnlinePlayersArray().slice(from, to).map(playerToSendableObject);

    apiResponse(res, 200, NetworkError.Ok, {players: resBody});
});

router.get("/server/:tag/players/offline", (req, res) => {
    const { from, to } = fromTo(req, 10);
    if (!(from || to)) return apiResponse(res, 400, NetworkError.InvalidRange);

    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

    const resBody = gameServer.getOfflinePlayersArray().slice(from, to).map(playerToSendableObject);

    apiResponse(res, 200, NetworkError.Ok, {players: resBody});
});
export default router;