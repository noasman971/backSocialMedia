import {generateToken} from "../services/auth";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import {Router} from "express";

const router = Router();


router.post("/auth/register", async (req: Request, res: Response) => {
    const { email, username, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(200).json({ error: "Email already used" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            username,
            password: hashed,
        },
    });

    const token = generateToken(user.id);
    res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username },
    });
});

router.post("/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    prisma.user
        .findUnique({ where: { email } })
        .then((user) => {
            if (!user) {
                return res.status(200).json({ error: "Invalid credentials" });
            }

            const valid = bcrypt.compareSync(password, user.password);
            if (!valid) {
                return res.status(200).json({ error: "Invalid credentials" });
            }

            const token = generateToken(user.id);
            res.json({
                token,
                user: { id: user.id, email: user.email, username: user.username },
            });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ error: "Something went wrong" });
        });
});

export default router;