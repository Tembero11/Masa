import express, { Router } from "express";
import jwt from "jsonwebtoken";
import Masa from "../classes/Masa";
import { NetworkError } from "./NetworkError";
import { apiResponse, keyManager } from "./openServer";

const router = Router();

router.use(express.json());

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post("/users/login", async(req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const username = req.body.username;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const password = req.body.password;

    if (!(typeof username == "string" && typeof password == "string")) {
        return apiResponse(res, 400, NetworkError.UnknownError);
    }
    
    const users = Masa.getConf().getFile("dash").users;
    if (!users) return apiResponse(res, 403, NetworkError.InvalidLoginCredentials);

    const user = users.find(user => user.username === username && user.password === password);

    if (!user) return apiResponse(res, 403, NetworkError.InvalidLoginCredentials);

    jwt.sign({
        username: user.username
    }, await keyManager.getPrivate(), { algorithm: "RS256" }, (err, token) => {
        if (!err && token) {
            res.cookie("Authorization", "Bearer " + token, {
                httpOnly: true
            });
            apiResponse(res, 200, NetworkError.Ok, {
                token
            });
        }else {
            apiResponse(res, 500, NetworkError.UnknownError);
        }
    });
});

export default router;