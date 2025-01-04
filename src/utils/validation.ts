interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: RegExp;
  message: string;
  allowedTypes?: string[];
  maxSize?: number;
}

export const ValidationRules: { [key: string]: ValidationRule } = {
  // User Inputs
  name: {
    min: 2,
    max: 100,
    pattern: /^[a-zA-Z0-9\s\-_']+$/,
    message: "Name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, and apostrophes"
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  password: {
    min: 8,
    max: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
    message: "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"
  },
  description: {
    min: 10,
    max: 1000,
    message: "Description must be between 10 and 1000 characters"
  },
  
  // Sound Profile
  profileTitle: {
    min: 2,
    max: 50,
    pattern: /^[a-zA-Z0-9\s\-_']+$/,
    message: "Title must be 2-50 characters and contain only letters, numbers, spaces, and hyphens"
  },
  
  // File Upload
  soundFile: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    message: "Please upload MP3, WAV, or OGG files under 50MB"
  }
};

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateInput(value: string, rule: keyof typeof ValidationRules): string | null {
  const rules = ValidationRules[rule];
  
  if (!value && rule !== 'description') {
    return 'This field is required';
  }
  
  if (rules.min && value.length < rules.min) {
    return `Must be at least ${rules.min} characters`;
  }
  
  if (rules.max && value.length > rules.max) {
    return `Must be no more than ${rules.max} characters`;
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.message;
  }
  
  return null;
}

export function validateFile(file: File): string | null {
  const rules = ValidationRules.soundFile;
  
  if (rules.maxSize && file.size > rules.maxSize) {
    return `File size exceeds ${rules.maxSize / 1024 / 1024}MB limit`;
  }
  
  if (!rules.allowedTypes?.includes(file.type)) {
    return 'Invalid file type. Please upload MP3, WAV, or OGG files only';
  }
  
  return null;
}

export function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}