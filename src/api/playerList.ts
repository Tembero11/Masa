import { Router } from "express";
import { ServerHandler } from "../serverHandler";
import { apiResponse } from "./openServer";

const router = Router();

router.get("/players/all/:tag", (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404);

    const resBody = gameServer.getAllPlayersArray().map(player => {
        return {
            username: player.getUsername(),
            uuid: player.getUUID(),
            isOnline: player.isOnline,
            // ...(function() {
            //     if (!player.isOnline) return {}
            //    return {
            //         joinTime: player.getJoinTime()
            //    } 
            // })()
        }
    });

    apiResponse(res, 200, {players: resBody});
});

router.get("/players/online/:tag", (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404);

    const resBody = gameServer.getOnlinePlayersArray().map(player => {
        return {
            username: player.getUsername(),
            uuid: player.getUUID()
        }
    });

    apiResponse(res, 200, resBody);
});

router.get("/players/offline/:tag", (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404);

    const resBody = gameServer.getOfflinePlayersArray().map(player => {
        return {
            username: player.getUsername(),
            uuid: player.getUUID()
        }
    });

    apiResponse(res, 200, resBody);
});

export default router;