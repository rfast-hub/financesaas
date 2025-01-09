export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateLoginInputs = (email: string, password: string) => {
  const errors = [];
  
  if (!validateEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address'
    });
  }
  
  if (!validatePassword(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least 8 characters, including uppercase, lowercase, numbers and special characters'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};