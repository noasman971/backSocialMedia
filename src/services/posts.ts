import multer from "multer";
import { Request, Response } from "express";
import path from "path";
import prisma from "../prisma";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
export const upload = multer({ storage });



// get the feed of all posts, most recent first
async function getPosts(req: Request, res: Response) {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
    });

    const feed = [];

    for (const post of posts) {
        // get the author from the database
        const author = await prisma.user.findUnique({
            where: { id: post.authorId },
        });
        const likeCount = await prisma.like.count({ where: { postId: post.id } });
        const commentCount = await prisma.comment.count({
            where: { postId: post.id },
        });

        feed.push({
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            created_at: post.createdAt,
            author: author ? { id: author.id, username: author.username } : null,
            likeCount,
            commentCount,
        });
    }

    res.json(feed);
}

async function handleCreatePost(req: Request, res: Response) {
    const { content } = req.body;
    const userId = (req as any).userId;

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await prisma.post.create({
        data: {
            content,
            imageUrl,
            authorId: userId,
        },
    });

    res.json(post);
}

async function getPostById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: true,
            comments: {
                include: { author: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const likeCount = await prisma.like.count({ where: { postId: id } });

    res.json({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        author: post.author,
        comments: post.comments,
        likeCount,
    });
}

async function deletePost(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    await prisma.post.delete({ where: { id } });

    res.json({ success: true });
}