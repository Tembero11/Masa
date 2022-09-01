import { Router } from "express";
import { ServerHandler } from "../serverHandler";

const router = Router();

router.post("/server/start/:tag", (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return res.status(404).json({code: 404});

    if (!gameServer.hasStreams) {
        try {
            res.json({success: gameServer.start()});
        }catch(err) {
            res.status(500).json({success: false})
        }
    }
});
router.post("/server/stop/:tag", async (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return res.status(404).json({code: 404});
    if (gameServer.hasStreams) {
        try {
            await gameServer.stop();
            res.json({success: true});
        }catch(err) {
            res.status(500).json({success: false})
        }
    }
});

export default router;