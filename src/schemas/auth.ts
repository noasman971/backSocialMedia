import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email invalide"),
    username: z
        .string()
        .trim()
        .min(3, "3 caractères minimum")
        .max(30, "30 caractères maximum"),
    password: z
        .string()
        .min(8, "8 caractères minimum")
        .max(72, "72 caractères maximum"),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;