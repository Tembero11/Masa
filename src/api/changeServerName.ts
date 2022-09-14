import express, { Router } from "express";
import { ServerHandler } from "../serverHandler";
import fs from "fs";
import { readServerMetadata, writeServerMetadata } from "../config";

const router = Router();

router.use(express.json());

router.post("/server/change-name/", async(req, res) => {
    const { server, newName } = req.body;
    if (!server || !newName) return res.status(400).json({code: 400});

    if (typeof newName == "string" && !(newName.length <= 20 && newName.length > 3)) {
        return res.status(400).json({code: 400});
    }

    const gameServer = ServerHandler.getServerById(server);

    if (!gameServer) return res.status(404).json({code: 404});

    if (gameServer.hasStreams) return res.status(503).json({code: 503});

    if (newName === gameServer?.name) return res.status(200).json({code: 200});

    try {
        let meta = await readServerMetadata(gameServer.dir);
        meta.name = newName;
        await writeServerMetadata(gameServer.dir, meta);

        await ServerHandler.setupServer({...meta, tag: gameServer.tag, directory: gameServer.dir});
    } catch (err) {
        return res.status(500).json({code: 500})
    }
    res.json({success: true});
});
export default router;