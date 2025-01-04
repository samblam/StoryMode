import { ValidationRules } from './validation';

declare global {
  interface Window {
    ValidationRules: typeof ValidationRules;
    validateInput: (value: string, rule: keyof typeof ValidationRules) => string | null;
  }
}

export function setupValidation(
  validateInput: (value: string, rule: keyof typeof ValidationRules) => string | null
) {
  if (typeof window !== 'undefined') {
    window.ValidationRules = ValidationRules;
    window.validateInput = validateInput;
  }
}