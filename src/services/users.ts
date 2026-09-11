import { Response, Request } from "express";
import prisma from "../prisma";
import { AuthenticatedRequest } from "./auth";


export const publicUserSelect = {
    id: true,
    username: true,
    createdAt: true,
} as const;


export async function fetch_me(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({
            error: "Non authentifié",
        });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: publicUserSelect,
    });

    if (!user) {
        return res.status(404).json({
            error: "Utilisateur introuvable",
        });
    }

    return res.json(user);
}


// fetch a user by id
export async function fetch_user(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            createdAt: true,
        },
    });

    if (!user) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(user);
}

export async function getUserPosts(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const posts = await prisma.post.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
    });

    return res.json(posts);
}