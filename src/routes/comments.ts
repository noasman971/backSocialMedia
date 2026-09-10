import { Response, Router } from "express";
import { authenticate, AuthenticatedRequest } from "../services/auth";
import prisma from "../prisma";
import {publicUserSelect} from "../services/users";

const router = Router();

router.post(
    "/posts/:id/comments",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.authorId;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Identifiant invalide" });
        }

        if (!userId) {
            return res.status(401).json({ error: "Non authentifié" });
        }

        const post = await prisma.post.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!post) {
            return res.status(404).json({ error: "Post introuvable" });
        }

        const comment = await prisma.comment.create({
            data: { content, postId: id, authorId: userId },
            include: { author: { select: publicUserSelect } },
        });

        res.json(comment);
    }
);

router.delete(
    "/comments/:id",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.userId;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Identifiant invalide" });
        }

        if (!userId) {
            return res.status(401).json({ error: "Non authentifié" });
        }

        const comment = await prisma.comment.findUnique({
            where: { id },
            select: {
                authorId: true,
            },
        });

        if (!comment) {
            return res.status(404).json({ error: "Commentaire introuvable" });
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: "Interdit" });
        }

        await prisma.comment.delete({ where: { id } });

        res.json({ success: true });
    }
);

export default router;