import express, { Router } from "express";
import { readServerMetadata, writeServerMetadata } from "../../config";
import { apiResponse } from "../openServer";
import { NetworkError } from "../NetworkError";
import Masa from "../../classes/Masa";

const router = Router();

router.use(express.json());

router.post("/server/change-name/", async(req, res) => {
    const { server, newName } = req.body;
    if (!server || !newName) return apiResponse(res, 400, NetworkError.UnknownError);

    if (typeof newName == "string" && !(newName.length <= 20 && newName.length > 3)) {
        return apiResponse(res, 400, NetworkError.UnknownError);
    }

    const gameServer = Masa.getServerByTag(server);

    if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

    if (gameServer.hasStreams) return apiResponse(res, 503, NetworkError.GameServerBadState);

    if (newName === gameServer?.name) return apiResponse(res, 200, NetworkError.Ok);

    try {
        let meta = await readServerMetadata(gameServer.dir);
        meta.name = newName;
        await writeServerMetadata(gameServer.dir, meta);

        await Masa.createServer({...meta, tag: gameServer.tag, directory: gameServer.dir});
    } catch (err) {
        return apiResponse(res, 500, NetworkError.UnknownError);
    }
    return apiResponse(res, 200, NetworkError.Ok);
});
export default router;