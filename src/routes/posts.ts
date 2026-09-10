import { authenticate } from "../services/auth";
import { Router } from "express";
import { getPostById, getPosts, handleCreatePost } from "../services/posts";
import {deletePost, uploadPostImage} from "../services/upload";

const router = Router();

router.get("/posts", getPosts);
router.post("/posts", authenticate, uploadPostImage, handleCreatePost);
router.get("/posts/:id", getPostById);
router.delete("/posts/:id", authenticate, deletePost);

export default router;