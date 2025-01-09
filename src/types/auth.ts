export interface LoginErrorType {
  title: string;
  message: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  error?: {
    title: string;
    description: string;
  };
}