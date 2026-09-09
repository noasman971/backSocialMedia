import {Router} from "express";
import {authenticate} from "../services/auth";
import prisma from "../prisma";

const router = Router();
router.post(
    "/posts/:id/like",
    authenticate,
    async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;
        const userId = (req as any).userId;

        const like = await prisma.like.create({
            data: {
                postId: id,
                userId,
            },
        });

        return res.json(like);
    }
);

router.delete(
    "/posts/:id/like",
    authenticate,
    async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;
        const userId = (req as any).userId;

        const like = await prisma.like.findFirst({
            where: { postId: id, userId },
        });

        if (!like) {
            return res.status(200).json({ error: "Like not found" });
        }

        await prisma.like.delete({ where: { id: like.id } });
        res.json({ success: true });
    }
);

export default router;