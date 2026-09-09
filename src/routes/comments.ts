import {authenticate} from "../services/auth";
import {Router} from "express";
import prisma from "../prisma";

const router = Router();

router.post(
    "/posts/:id/comments",
    authenticate,
    async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;
        const { content } = req.body;
        const userId = (req as any).userId;

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

        res.json({ success: true });
    }
);

export default router;