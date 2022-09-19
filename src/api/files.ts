import express, { Router } from "express";
import { ServerHandler } from "../serverHandler";

import fs from "fs";
import { apiResponse } from "./openServer";
import path from "path";

const router = Router();

router.use(express.json());

router.get("/files/:tag/:filepath", async (req, res, next) => {
    const gameServer = ServerHandler.getServerById(req.params.tag);
    if (!gameServer) return apiResponse(res, 404);
    
    const { dir } = gameServer;

    let files;
    try {
      files = await fs.promises.readdir(path.join(dir, decodeURIComponent(req.params.filepath)), { withFileTypes: true });
    } catch (err) {
      return apiResponse(res, 500);
    }

    return apiResponse(res, 200, {
      files: [
        files.filter(e => e.isFile() || e.isDirectory()).map(e => {
          return {
            name: e.name,
            type: e.isFile() ? "file" : "directory",
          }
        })
      ]
    });

});

export default router;