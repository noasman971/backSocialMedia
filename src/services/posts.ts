import multer from "multer";
import { Request, Response } from "express";
import path from "path";
import prisma from "../prisma";
import { AuthenticatedRequest } from "./auth";
import { publicUserSelect } from "./users";

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
export const upload = multer({ storage });

// get the feed of all posts, most recent first
export async function getPosts(_req: Request, res: Response) {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            author: { select: publicUserSelect },
            _count: { select: { likes: true, comments: true } },
        },
    });

    const feed = posts.map((post) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        created_at: post.createdAt,
        author: post.author,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
    }));

    res.json(feed);
}

export async function handleCreatePost(req: AuthenticatedRequest, res: Response) {
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: "Non authentifié" });
    }

    console.log(req);

    if (typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({
            error: "Le contenu du post est obligatoire",
        });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await prisma.post.create({
        data: { content, imageUrl, authorId: userId },
        include: { author: { select: publicUserSelect } },
    });

    res.json(post);
}

export async function getPostById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: { select: publicUserSelect },
            comments: {
                include: { author: { select: publicUserSelect } },
                orderBy: { createdAt: "asc" },
            },
            _count: { select: { likes: true } },
        },
    });

    if (!post) {
        return res.status(404).json({ error: "Post introuvable" });
    }

    res.json({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        author: post.author,
        comments: post.comments,
        likeCount: post._count.likes,
    });
}