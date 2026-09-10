import { Router, Request, Response } from "express";
import { authenticate } from "../services/auth";
import prisma from "../prisma";

const router = Router();

interface AuthRequest extends Request<{ id: string }> {
    authorId: string;
}

router.post(
    "/posts/:id/like",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.authorId;

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
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.authorId;

        const like = await prisma.like.findFirst({
            where: {
                postId: id,
                userId: userId,
            },
        });

        if (!like) {
            return res.status(200).json({
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
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const userId = req.authorId;

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

