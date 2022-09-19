import express, { Router } from "express";
import { ServerHandler } from "../serverHandler";
import fs from "fs";
import { readServerMetadata, writeServerMetadata } from "../config";
import { apiResponse } from "./openServer";

const router = Router();

router.use(express.json());

router.post("/server/change-name/", async(req, res) => {
    const { server, newName } = req.body;
    if (!server || !newName) return apiResponse(res, 400);

    if (typeof newName == "string" && !(newName.length <= 20 && newName.length > 3)) {
        return apiResponse(res, 400);
    }

    const gameServer = ServerHandler.getServerById(server);

    if (!gameServer) return apiResponse(res, 404);

    if (gameServer.hasStreams) return apiResponse(res, 503);

    if (newName === gameServer?.name) return apiResponse(res, 200);

    try {
        let meta = await readServerMetadata(gameServer.dir);
        meta.name = newName;
        await writeServerMetadata(gameServer.dir, meta);

        await ServerHandler.setupServer({...meta, tag: gameServer.tag, directory: gameServer.dir});
    } catch (err) {
        return apiResponse(res, 500);
    }
    return apiResponse(res, 200);
});
export default router;