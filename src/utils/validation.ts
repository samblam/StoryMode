interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  custom?: (value: string) => boolean;
  message: string;
}

interface ValidationRules {
  [field: string]: ValidationRule[];
}

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[A-Za-z0-9\s\-']+$/,
  SLUG: /^[a-z0-9-]+$/,
  SAFE_STRING: /^[A-Za-z0-9\s\-_.,!?'"()]+$/,
  FILE_NAME: /^[A-Za-z0-9\-_]+\.[A-Za-z0-9]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Common validation rules
const COMMON_RULES = {
  email: [
    { pattern: PATTERNS.EMAIL, message: 'Please enter a valid email address' }
  ],
  name: [
    { pattern: PATTERNS.NAME, message: 'Name contains invalid characters' },
    { minLength: 2, message: 'Name must be at least 2 characters' },
    { maxLength: 100, message: 'Name cannot exceed 100 characters' }
  ],
  password: [
    { minLength: 8, message: 'Password must be at least 8 characters' },
    { 
      custom: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value),
      message: 'Password must contain uppercase, lowercase, and numbers'
    }
  ],
  title: [
    { pattern: PATTERNS.NAME, message: 'Title contains invalid characters' },
    { minLength: 2, message: 'Title must be at least 2 characters' },
    { maxLength: 50, message: 'Title cannot exceed 50 characters' }
  ],
  description: [
    { pattern: PATTERNS.SAFE_STRING, message: 'Description contains invalid characters' },
    { minLength: 10, message: 'Description must be at least 10 characters' },
    { maxLength: 200, message: 'Description cannot exceed 200 characters' }
  ],
  fileName: [
    { pattern: PATTERNS.FILE_NAME, message: 'Invalid file name format' },
    { minLength: 2, message: 'File name must be at least 2 characters' },
    { maxLength: 50, message: 'File name cannot exceed 50 characters' }
  ],
  clientId: [
    { pattern: PATTERNS.UUID, message: 'Invalid client ID format' }
  ]
};

function sanitizeInput(input: string, allowHTML = false): string {
  if (typeof input !== 'string') return '';
  
  // Basic sanitization
  let sanitized = input.trim();
  
  if (!allowHTML) {
    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Remove potential script injection patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
    
  return sanitized;
}

function validateField(value: string, rules: ValidationRule[]): { valid: boolean; message?: string } {
  for (const rule of rules) {
    if (rule.required && !value) {
      return { valid: false, message: 'This field is required' };
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return { valid: false, message: rule.message };
    }
    if (rule.minLength && value.length < rule.minLength) {
      return { valid: false, message: rule.message };
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return { valid: false, message: rule.message };
    }
    if (rule.custom && !rule.custom(value)) {
      return { valid: false, message: rule.message };
    }
  }
  return { valid: true };
}

export { PATTERNS, COMMON_RULES, sanitizeInput, validateField };
export type { ValidationRule, ValidationRules };