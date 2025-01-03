export const extractWaitTime = (errorMessage: string): number => {
  const waitTime = errorMessage.match(/\d+/)?.[0] || '60';
  return parseInt(waitTime);
};

export const isRateLimitError = (error: any): boolean => {
  return error?.message?.includes('rate_limit') || error?.status === 429;
};

export const getErrorMessage = (error: any): string => {
  if (error?.message === 'Failed to fetch') {
    return 'Network error. Please check your connection and try again.';
  }
  if (isRateLimitError(error)) {
    return 'Too many requests. Please try again in a few minutes.';
  }
  return error?.message || 'An unexpected error occurred. Please try again later.';
};