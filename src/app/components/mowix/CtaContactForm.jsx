"use client";

import { useState } from "react";
import HomeIcon from "./HomeIcon";
import { CONTACT_LIMITS, validateContact } from "./contactValidation";

const EMPTY = { name: "", phone: "", message: "" };

export default function CtaContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (status === "success" || status === "error") setStatus("idle");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const { errors: found } = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      event.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setStatus("error");
        return;
      }
      setValues(EMPTY);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const field = (name) => ({
    id: `cta-${name}`,
    name,
    value: values[name],
    onChange,
    maxLength: CONTACT_LIMITS[name],
    "aria-invalid": errors[name] ? "true" : undefined,
    "aria-describedby": errors[name] ? `cta-${name}-error` : undefined,
    disabled: status === "sending",
  });

  const error = (name) =>
    errors[name] ? (
      <p id={`cta-${name}-error`} className="cta-form__error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form className="cta-form" onSubmit={onSubmit} noValidate>
      <div className="cta-form__row">
        <div className="cta-form__field">
          <label htmlFor="cta-name">Name</label>
          <input type="text" autoComplete="name" placeholder="Ihr vollständiger Name" {...field("name")} />
          {error("name")}
        </div>
        <div className="cta-form__field">
          <label htmlFor="cta-phone">Telefonnummer</label>
          <input type="tel" autoComplete="tel" inputMode="tel" placeholder="+43 660 1234567" {...field("phone")} />
          {error("phone")}
        </div>
      </div>
      <div className="cta-form__field">
        <label htmlFor="cta-message">Ihre Nachricht</label>
        <textarea rows={3} placeholder="Erzählen Sie uns kurz von Ihrem Vorhaben …" {...field("message")} />
        {error("message")}
      </div>

      <div className="elementor-element elementor-element-4c019e29 elementor-align-justify elementor-widget__width-initial elementor-widget elementor-widget-button">
        <button type="submit" className="elementor-button elementor-size-sm" disabled={status === "sending"}>
          <span className="elementor-button-content-wrapper">
            <span className="elementor-button-icon">
              <HomeIcon name="arrowRight" />
            </span>{" "}
            <span className="elementor-button-text">
              {status === "sending" ? "Wird gesendet …" : "Erstgespräch anfragen"}
            </span>
          </span>
        </button>
      </div>

      <p className="cta-form__status" role="status" aria-live="polite">
        {status === "success" && "Vielen Dank! Ihre Nachricht ist bei uns eingegangen – wir melden uns in Kürze."}
        {status === "error" && "Das hat leider nicht geklappt. Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut."}
      </p>
    </form>
  );
}
