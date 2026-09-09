import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import postRouter from "./routes/posts";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import likesRouter from "./routes/likes";
import commentRouter from "./routes/comments";

dotenv.config();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(
    cors({
      origin: process.env.FRONTEND_URL,
    })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(postRouter);
app.use(authRouter);
app.use(userRouter);
app.use(likesRouter);
app.use(commentRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
