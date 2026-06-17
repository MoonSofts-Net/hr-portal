import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "validation.auth.emailOrCpfRequired"),
  password: z.string().min(1, "validation.auth.passwordRequired"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("validation.auth.validEmail"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.auth.currentPasswordRequired"),
    newPassword: z.string().min(8, "validation.auth.minPassword"),
    confirmPassword: z.string().min(1, "validation.auth.confirmNewPassword"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.auth.passwordsNoMatch",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "validation.auth.minPassword"),
    confirmPassword: z.string().min(1, "validation.auth.confirmNewPassword"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.auth.passwordsNoMatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
