import {Router} from "express";
import { fetch_user, getUserPosts } from "../services/users";

const router = Router();

router.get("/users/:id", fetch_user);
router.get("/users/:id/posts", getUserPosts);

export default router;