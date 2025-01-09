export const extractWaitTime = (errorMessage: string): number => {
  const waitTime = errorMessage.match(/\d+/)?.[0] || '60';
  return parseInt(waitTime);
};

export const isRateLimitError = (error: any): boolean => {
  return error?.message?.includes('rate_limit') || error?.status === 429;
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.message === 'Failed to fetch') {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (isRateLimitError(error)) {
    return `Too many attempts. Please try again in ${extractWaitTime(error.message)} seconds.`;
  }
  
  if (error?.code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  
  if (error?.code === 'auth/wrong-password') {
    return 'Invalid password. Please try again.';
  }
  
  return error?.message || 'An unexpected error occurred. Please try again later.';
};

export const sanitizeErrorMessage = (message: string): string => {
  // Remove any sensitive information from error messages
  return message.replace(/\b(?:password|email|token|key)\b/gi, '***');
};