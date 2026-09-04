import React from "react";

export default function PendingApproval({ email, onLogout }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EEF1F4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 400,
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #D7DCE1",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#1B2430",
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
            margin: "0 0 8px",
          }}
        >
          Compte en attente de validation
        </h1>
        <p style={{ fontSize: 13.5, color: "#5C6B7A", lineHeight: 1.5, margin: "0 0 20px" }}>
          Ton compte ({email}) a bien été créé, mais un administrateur doit encore valider ton accès avant que tu
          puisses utiliser l'application. Reviens un peu plus tard.
        </p>
        <button
          onClick={onLogout}
          style={{
            border: "1px solid #D7DCE1",
            background: "transparent",
            color: "#5C6B7A",
            padding: "9px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
