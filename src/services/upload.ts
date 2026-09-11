// src/services/uploads.ts
import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import path from "path";
import {AuthenticatedRequest} from "./auth";
import prisma from "../prisma";

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

const ALLOWED_MIME_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
        const extension = ALLOWED_MIME_TYPES[file.mimetype];

        if (extension === undefined) {
            return cb(new Error("Type de fichier non autorisé"), "");
        }

        cb(null, `${crypto.randomUUID()}${extension}`);
    },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    if (ALLOWED_MIME_TYPES[file.mimetype] === undefined) {
        return cb(new Error("Type de fichier non autorisé"));
    }

    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
        fields: 10,
    },
});

export function uploadPostImage(req: Request, res: Response, next: NextFunction) {
    upload.single("image")(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({ error: "Image trop volumineuse (2 Mo maximum)" });
            }
            return res.status(400).json({ error: "Envoi de fichier invalide" });
        }

        if (err instanceof Error) {
            return res.status(400).json({ error: err.message });
        }

        next();
    });
}

export async function deletePost(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.userId;

    if (typeof id !== "string") {
        return res.status(400).json({ error: "Identifiant invalide" });
    }

    if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
    }

    const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
    });

    if (!post) {
        return res.status(404).json({ error: "Post introuvable" });
    }

    if (post.authorId !== userId) {
        return res.status(403).json({ error: "Interdit" });
    }

    await prisma.post.delete({ where: { id } });

    res.json({ success: true });
}