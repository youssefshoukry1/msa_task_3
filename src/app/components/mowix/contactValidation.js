// Shared by the contact form (instant feedback) and /api/contact (authoritative check).
export const CONTACT_LIMITS = { name: 100, email: 254, phone: 30, message: 2000 };

export function validateContact(input = {}) {
  const values = {
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    message: String(input.message ?? "").trim(),
    privacy: input.privacy === true,
  };
  const errors = {};

  if (values.name.length < 2) errors.name = "Bitte geben Sie Ihren Namen ein.";
  else if (values.name.length > CONTACT_LIMITS.name) errors.name = "Der Name ist zu lang.";

  if (!values.email) errors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
  else if (values.email.length > CONTACT_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";

  const digits = values.phone.replace(/\D/g, "");
  if (!values.phone) errors.phone = "Bitte geben Sie Ihre Telefonnummer ein.";
  else if (!/^[+\d\s()/-]+$/.test(values.phone) || digits.length < 6 || digits.length > 15)
    errors.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";

  if (values.message.length < 10) errors.message = "Bitte beschreiben Sie Ihr Vorhaben kurz (mind. 10 Zeichen).";
  else if (values.message.length > CONTACT_LIMITS.message) errors.message = "Die Nachricht ist zu lang.";

  if (!values.privacy) errors.privacy = "Bitte stimmen Sie der Datenschutzerklärung zu.";

  return { values, errors };
}
