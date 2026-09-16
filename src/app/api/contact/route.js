import { NextResponse } from "next/server";
import { validateContact } from "../../components/mowix/contactValidation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { values, errors } = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // TODO: deliver the enquiry (email, CRM, WhatsApp, ...). For now it is only logged.
  console.log("[contact] New enquiry", { ...values, receivedAt: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
