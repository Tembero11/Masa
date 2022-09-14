import { Router } from "express";
import { ServerHandler } from "../serverHandler";
import fs from "fs";
import { readServerMetadata, writeServerMetadata } from "../config";

const router = Router();

router.post("/server/change-name/:tag/:newName", async(req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return res.status(404).json({code: 404});

    let meta = await readServerMetadata(gameServer.dir);
    meta.name = req.params.newName;
    await writeServerMetadata(gameServer.dir, meta);

    ServerHandler.setupServer({...meta, tag: gameServer.tag, directory: gameServer.dir});

    res.json({success: true});
});
export default router;