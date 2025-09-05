// Security utilities for input validation and sanitization

export const SecurityUtils = {
  // XSS Prevention - sanitize HTML content
  sanitizeHTML: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // SQL Injection prevention - escape special characters
  escapeSQL: (input: string): string => {
    return input
      .replace(/[\0\n\r\b\t\cZ\cX\cV\cA]/g, '')
      .replace(/'/g, "''")
      .replace(/"/g, '""');
  },

  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password strength validation
  isValidPassword: (password: string): boolean => {
    return password.length >= 6 && password.length <= 128;
  },

  // Rate limiting helper
  checkRateLimit: (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const attempts = JSON.parse(sessionStorage.getItem(key) || '[]');
    
    // Filter out old attempts
    const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    sessionStorage.setItem(key, JSON.stringify(recentAttempts));
    return true;
  },

  // Input length validation
  validateLength: (input: string, min: number, max: number): boolean => {
    const length = input.trim().length;
    return length >= min && length <= max;
  },

  // Prevent directory traversal
  sanitizeFileName: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.\./g, '_');
  }
};