"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function PartnerWithUsModal({
  email,
  className,
  children,
  plain = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("sending");
    setFeedback(null);

    try {
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback({
          type: "error",
          text:
            data.error ||
            "Something went wrong. Please try again or email us directly.",
        });
        setStatus("idle");
        return;
      }

      setFeedback({
        type: "success",
        text: "Your message was sent. We will get back to you soon.",
      });
      setStatus("success");
      setValues({
        name: "",
        email: "",
        organization: "",
        message: "",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error. Check your connection and try again.",
      });
      setStatus("idle");
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  const modal =
    isOpen && typeof document !== "undefined" ? (
      <div
        className="modal-backdrop"
        role="presentation"
        onClick={handleClose}
      >
        <div
          className={`modal-panel ${plain ? "modal-panel-plain" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2 id={titleId} className="modal-title">
                Partner With Us
              </h2>
              <p className="modal-subtitle">
                Your message is sent to our team at {email}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="focus-visible-ring modal-close"
              aria-label="Close partner form"
            >
              ×
            </button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            {feedback ? (
              <p
                className={`modal-feedback ${
                  feedback.type === "error"
                    ? "modal-feedback--error"
                    : "modal-feedback--success"
                }`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.text}
              </p>
            ) : null}

            <label className="modal-field">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={updateValue}
                required
                disabled={status === "sending" || status === "success"}
                autoComplete="name"
              />
            </label>

            <label className="modal-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={updateValue}
                required
                disabled={status === "sending" || status === "success"}
                autoComplete="email"
              />
            </label>

            <label className="modal-field">
              <span>Organization</span>
              <input
                type="text"
                name="organization"
                value={values.organization}
                onChange={updateValue}
                required
                disabled={status === "sending" || status === "success"}
              />
            </label>

            <label className="modal-field">
              <span>Message</span>
              <textarea
                name="message"
                rows={6}
                value={values.message}
                onChange={updateValue}
                placeholder="Tell us about your partnership idea."
                required
                disabled={status === "sending" || status === "success"}
              />
            </label>

            <div className="modal-actions">
              {status === "success" ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="focus-visible-ring brand-btn px-5 py-2.5 text-sm font-medium"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="focus-visible-ring outline-btn px-5 py-2.5 text-sm font-medium"
                    disabled={status === "sending"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="focus-visible-ring brand-btn px-5 py-2.5 text-sm font-medium"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "Sending…" : "Send message"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          setFeedback(null);
          setIsOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
