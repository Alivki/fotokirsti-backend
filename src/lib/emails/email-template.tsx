/** @jsxImportSource react */
import React from "react";

export interface EmailTemplateProps {
  firstName: string;
  email: string;
  phone_number: string | number;
  category: string;
  message: string;
}

/**
 * Contact form email template. Uses native HTML elements only (no @react-email/components)
 * so it works with renderToStaticMarkup in Bun. @react-email components produce internal
 * structures that conflict with Bun's React DOM server.
 */
export function EmailTemplate({
  firstName,
  email,
  phone_number,
  category,
  message,
}: EmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif", backgroundColor: "#f6f9fc" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            margin: "0 auto",
            padding: "40px 20px",
            maxWidth: "600px",
          }}
        >
          <h1 style={{ color: "#000", fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
            Ny henvendelse fra {firstName}
          </h1>
          <p style={{ color: "#333", fontSize: "15px", marginBottom: "16px" }}>
            Du har mottatt en ny melding fra kontaktskjemaet ditt.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#666", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Navn</div>
            <div style={{ color: "#333", fontSize: "15px" }}>{firstName}</div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#666", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>E-post</div>
            <div style={{ color: "#333", fontSize: "15px" }}>{email}</div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#666", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Telefon</div>
            <div style={{ color: "#333", fontSize: "15px" }}>{String(phone_number)}</div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ color: "#666", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Kategori</div>
            <div style={{ color: "#333", fontSize: "15px" }}>{category}</div>
          </div>

          <div style={{ color: "#666", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Melding</div>
          <p style={{ color: "#333", fontSize: "15px", lineHeight: "24px", whiteSpace: "pre-wrap" }}>
            {String(message)}
          </p>
        </div>
      </body>
    </html>
  );
}
