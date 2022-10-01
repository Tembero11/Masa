import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { apiResponse, keyManager } from "./openServer";
import { NetworkError } from "./NetworkError";


export default async function verifyToken(req: Request, res: Response, next: NextFunction) {
    const isCookie = Object.hasOwn(req.cookies as object, "authorization");
    const isHeader = Object.hasOwn(req.headers, "authorization");

    let bearer;
    if (isHeader) bearer = req.headers["authorization"];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    if (isCookie) bearer = req.cookies["authorization"];

    if (typeof bearer != "string") return apiResponse(res, 403, NetworkError.InvalidLoginCredentials);

    if (bearer.startsWith("Bearer ")) return apiResponse(res, 403, NetworkError.InvalidLoginCredentials);

    const token = bearer.substring(bearer.indexOf(" "));

    jwt.verify(token, await keyManager.getPublic(), { algorithms: ["RS256"] }, (err, decoded) => {
        if (!err && decoded) {
            next();
        }else {
            apiResponse(res, 403, NetworkError.InvalidLoginCredentials);
        }
    });
}