import { Router } from "express";
import Masa from "../classes/Masa";

const router = Router();

router.get("/server-list", (req, res) => {
    res.json(Masa.getServers().map(gameServer => {
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