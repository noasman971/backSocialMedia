import {authenticate} from "../services/auth";
import {Router} from "express";
import {upload} from "../services/posts";

const router = Router();

router.get("/posts", getPosts);
router.post("/posts", authenticate, upload.single("image"), handleCreatePost);
router.get("/posts/:id", getPostById);
router.delete("/posts/:id", authenticate, deletePost);

export default router;