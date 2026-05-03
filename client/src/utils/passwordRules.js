export const PASSWORD_RULES = [
  { id: "length", label: "8-72 characters", test: (value) => value.length >= 8 && value.length <= 72 },
  { id: "lower", label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { id: "upper", label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "One number", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "One symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function isStrongPassword(value) {
  return PASSWORD_RULES.every((rule) => rule.test(String(value || "")));
}
