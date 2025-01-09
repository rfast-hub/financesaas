import { LoginValidationResult } from "@/types/auth";
import { validateEmail, validatePassword } from "@/utils/validation";

export const validateLoginInputs = (email: string, password: string): LoginValidationResult => {
  if (!validateEmail(email)) {
    return {
      isValid: false,
      error: {
        title: "Invalid email",
        description: "Please enter a valid email address.",
      }
    };
  }

  if (!validatePassword(password)) {
    return {
      isValid: false,
      error: {
        title: "Invalid password",
        description: "Password must be at least 8 characters long.",
      }
    };
  }

  return { isValid: true };
};