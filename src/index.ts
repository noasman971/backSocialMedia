import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import postRouter from "./routes/posts";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import likesRouter from "./routes/likes";
import commentRouter from "./routes/comments";


const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
    throw new Error(
        "FATAL: FRONTEND_URL environment variable is missing."
    );
}

const app = express();

app.use(
    cors({
        origin: FRONTEND_URL,
    })
);

app.use(express.json());
app.use(
    "/uploads",
    express.static(uploadsDir, {
        setHeaders: (res) => {
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Content-Security-Policy", "default-src 'none'");
        },
        dotfiles: "deny",
        index: false,
    })
);
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(postRouter);
app.use(authRouter);
app.use(userRouter);
app.use(likesRouter);
app.use(commentRouter);

// 404
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
    });
});

// Gestion globale des erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);

    res.status(500).json({
        error: "Internal server error",
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
