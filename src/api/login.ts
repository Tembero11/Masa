import express, { Router } from "express";
import { NetworkError } from "./NetworkError";
import { apiResponse } from "./openServer";

const router = Router();

router.use(express.json())

router.post("/users/login", (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const username = req.body.username;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const password = req.body.password;

    if (!(typeof username == "string" && typeof password == "string")) {
        return apiResponse(res, 400, NetworkError.UnknownError);
    }
    

});
export default router;