import { PASSWORD_RULES } from "@shared/config/config";
import z from "zod";

export const emailSchema = z.string().email("Invalid email address");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long");

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_RULES.minLength,
    `Password must be at least ${PASSWORD_RULES.minLength} characters long`
  )
  .refine((val) => !PASSWORD_RULES.requireUppercase || /[A-Z]/.test(val), {
    message: "Must contain an uppercase letter",
  })
  .refine((val) => !PASSWORD_RULES.requireLowercase || /[a-z]/.test(val), {
    message: "Must contain a lowercase letter",
  })
  .refine((val) => !PASSWORD_RULES.requireNumber || /[0-9]/.test(val), {
    message: "Must contain a number",
  })
  .refine((val) => !PASSWORD_RULES.requireSymbol || /[^a-zA-Z0-9]/.test(val), {
    message: "Must contain a special character",
  });

export type passwordSchemaType = z.infer<typeof passwordSchema>;

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Please provide at least one field to update",
  });

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;
