import { Router, Response } from "express";
import { authenticate, AuthenticatedRequest } from "../services/auth";
import prisma from "../prisma";

const router = Router();

router.post(
    "/posts/:id/like",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: "Non authentifié" });
        }

        if (typeof id !== "string") {
            return res.status(400).json({
                error: "ID de post invalide",
            });
        }

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return res.status(404).json({
                error: "Post introuvable",
            });
        }

        const like = await prisma.like.create({
            data: {
                postId: id,
                userId: userId,
            },
        });

        return res.json(like);
    }
);

router.delete(
    "/posts/:id/like",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: "Non authentifié" });
        }

        if (typeof id !== "string") {
            return res.status(400).json({
                error: "ID de post invalide",
            });
        }

        const like = await prisma.like.findFirst({
            where: {
                postId: id,
                userId: userId,
            },
        });

        if (!like) {
            return res.status(404).json({
                error: "Like not found",
            });
        }

        await prisma.like.delete({
            where: {
                id: like.id,
            },
        });

        return res.json({
            success: true,
        });
    }
);

router.get(
    "/posts/:id/like",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: "Non authentifié" });
        }

        if (typeof id !== "string") {
            return res.status(400).json({
                error: "ID de post invalide",
            });
        }

        const like = await prisma.like.findFirst({
            where: {
                postId: id,
                userId,
            },
        });

        return res.json({
            liked: !!like,
        });
    }
);

export default router;
