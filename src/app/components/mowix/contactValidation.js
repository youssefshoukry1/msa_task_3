// Shared by the contact form (instant feedback) and /api/contact (authoritative check).
export const CONTACT_LIMITS = { name: 100, phone: 30, message: 2000 };

export function validateContact(input = {}) {
  const values = {
    name: String(input.name ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    message: String(input.message ?? "").trim(),
  };
  const errors = {};

  if (values.name.length < 2) errors.name = "Bitte geben Sie Ihren Namen ein.";
  else if (values.name.length > CONTACT_LIMITS.name) errors.name = "Der Name ist zu lang.";

  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone) errors.phone = "Bitte geben Sie Ihre Telefonnummer ein.";
  else if (!/^[+\d\s()/-]+$/.test(values.phone) || digits.length < 6 || digits.length > 15)
    errors.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";

  if (values.message.length < 10) errors.message = "Bitte beschreiben Sie Ihr Vorhaben kurz (mind. 10 Zeichen).";
  else if (values.message.length > CONTACT_LIMITS.message) errors.message = "Die Nachricht ist zu lang.";

  return { values, errors };
}
