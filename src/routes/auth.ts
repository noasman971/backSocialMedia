import { Response, Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { generateToken } from "../services/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validateBody, ValidatedRequest } from "../middleware/validate";
import {
    registerSchema,
    loginSchema,
    RegisterInput,
    LoginInput,
} from "../schemas/auth";

const router = Router();

// Hash factice comparé quand l'email est inconnu, pour que le temps de
// réponse ne révèle pas l'existence d'un compte. Calculé une fois au démarrage.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

router.post(
    "/auth/register",
    authLimiter,
    validateBody(registerSchema),
    async (req: ValidatedRequest<RegisterInput>, res: Response) => {
        const { email, username, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        try {
            const user = await prisma.user.create({
                data: { email, username, password: hashed },
                select: { id: true, email: true, username: true },
            });

            const token = generateToken(user.id);
            return res.status(201).json({ token, user });
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
            ) {
                return res.status(409).json({ error: "Email déjà utilisé" });
            }

            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
    }
);

router.post(
    "/auth/login",
    authLimiter,
    validateBody(loginSchema),
    async (req: ValidatedRequest<LoginInput>, res: Response) => {
        const { email, password } = req.body;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                await bcrypt.compare(password, DUMMY_HASH);
                return res.status(401).json({ error: "Identifiants invalides" });
            }

            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return res.status(401).json({ error: "Identifiants invalides" });
            }

            const token = generateToken(user.id);
            return res.json({
                token,
                user: { id: user.id, email: user.email, username: user.username },
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
    }
);

export default router;