import { Router } from "express";
import { ServerHandler } from "../serverHandler";

const router = Router();

router.get("/server-list", (req, res) => {
    res.json(ServerHandler.servers.map(gameServer => {
        const meta = gameServer.metadata;
        return {
            name: meta?.name,
            description: meta?.description,
            tag: meta?.tag,
            isJoinable: gameServer.isJoinable,
            playerCount: gameServer.playerCount
        }
    }))
});

export default router;