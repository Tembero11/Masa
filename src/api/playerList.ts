import { Router } from "express";
import { ServerHandler } from "../serverHandler";

const router = Router();
// TODO
router.get("/players/:tag", (req, res) => {
    const players = ServerHandler.getServerById(req.params.tag)?.players;
    console.log(players)
    throw new Error("Unimplemented!");
    
});

export default router;