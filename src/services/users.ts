import prisma from "../prisma";

// fetch a user by id
function fetch_user(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    return prisma.user.findUnique({ where: { id } }).then((user) => {
        res.json(user);
    });
}

async function getUserPosts(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    const posts = await prisma.post.findMany({
        where: { authorId: id },
        orderBy: { createdAt: "desc" },
    });

    return res.json(posts);
}