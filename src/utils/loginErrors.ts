import { LoginErrorType } from "@/types/auth";

export const getLoginErrorMessage = (errorMessage: string): LoginErrorType => {
  switch (true) {
    case errorMessage.includes("Invalid login credentials"):
      return {
        title: "Invalid credentials",
        message: "The email or password you entered is incorrect. Please check your credentials and try again."
      };
    case errorMessage.includes("Email not confirmed"):
      return {
        title: "Email not verified",
        message: "Please check your email and click the verification link before signing in."
      };
    default:
      return {
        title: "Login failed",
        message: "An error occurred during login."
      };
  }
};