import crypto from "crypto";
import util from "util";
import fs from "fs";
import path from "path";
import assert from "assert";

interface KeyPair {
    publicKey: string
    privateKey: string
}
export default class DashKeyManager {
    KEY_DIRECTORY: string = path.join(process.cwd(), "keys");

    private publicKey?: string;
    private privateKey?: string;

    async getPublic() {
        if (!this.publicKey) {
            await this.readKeys();
        }
        return this.publicKey as string;
    }
    async getPrivate() {
        if (!this.privateKey) {
            await this.readKeys();
        }
        return this.privateKey as string;
    }
    async readKeys() {
        const publicFilepath = path.join(this.KEY_DIRECTORY, "public.key");
        const privateFilepath = path.join(this.KEY_DIRECTORY, "private.key");

        try {
            this.publicKey = await fs.promises.readFile(publicFilepath, "utf8");
            this.privateKey = await fs.promises.readFile(privateFilepath, "utf8");
        } catch (err) {
            const { publicKey, privateKey } = await this.generateRSAKeyPair();
            this.publicKey = publicKey;
            this.privateKey = privateKey;
            await this.writeKeys();
        }
    }
    async generateRSAKeyPair(): Promise<KeyPair> {
        return await util.promisify(crypto.generateKeyPair)("rsa", {
            modulusLength: 1024,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    async writeKeys() {
        assert(this.publicKey && this.privateKey);
        await fs.promises.mkdir(this.KEY_DIRECTORY, { recursive: true });
        await fs.promises.writeFile(path.join(this.KEY_DIRECTORY, "public.key"), this.publicKey, "utf8");
        await fs.promises.writeFile(path.join(this.KEY_DIRECTORY, "private.key"), this.privateKey, "utf8");
    }
}