import { authenticate, AuthenticatedRequest } from "../services/auth";
import {Router} from "express";
import prisma from "../prisma";

const router = Router();

router.post(
    "/posts/:id/comments",
    authenticate,
    async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.authorId;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return res.status(404).json({
                error: "Post introuvable",
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: id,
                authorId: userId,
            },
            include: { author: true },
        });

        res.json(comment);
    }
);

router.delete(
    "/comments/:id",
    authenticate,
    async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;

        await prisma.comment.delete({ where: { id } });
        const comment = await prisma.comment.findUnique({
            where: { id },
            include: {
                post: true,
            },
        });
        if (
            comment.authorId !== req.userId &&
            comment.post.authorId !== req.userId
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }

        res.json({ success: true });
    }
);

export default router;