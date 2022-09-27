import { Router } from "express";
import { ServerHandler } from "../../serverHandler";
import { NetworkError } from "../NetworkError";
import { apiResponse } from "../openServer";

const router = Router();

router.post("/server/:tag/start/", (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

    gameServer.safeStart();

    return apiResponse(res, 200, NetworkError.Ok);
});
router.post("/server/:tag/stop/", async (req, res) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);

    if (!gameServer) return apiResponse(res, 404, NetworkError.GameServerNotFound);

    gameServer.safeStop();

    return apiResponse(res, 200, NetworkError.Ok);
});

export default router;