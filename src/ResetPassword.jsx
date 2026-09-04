import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EEF1F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    padding: 20,
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D7DCE1",
    padding: "28px 26px",
    boxShadow: "0 24px 60px rgba(20,30,40,0.10)",
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: "#1B2430",
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    margin: "0 0 4px",
  },
  subtitle: { fontSize: 13, color: "#5C6B7A", margin: "0 0 22px" },
  label: {
    display: "block",
    fontSize: 11.5,
    fontWeight: 600,
    color: "#5C6B7A",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #D7DCE1",
    fontSize: 14,
    color: "#1B2430",
    background: "#FBFCFD",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  },
  button: {
    width: "100%",
    background: "#1B2430",
    color: "#fff",
    border: "none",
    padding: "11px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#A64B42", fontSize: 12.5, marginBottom: 12 },
  message: { color: "#1D6E64", fontSize: 12.5, marginBottom: 12 },
};

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Mot de passe mis à jour. Redirection…");
      setTimeout(() => onDone(), 1200);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Nouveau mot de passe</h1>
        <p style={styles.subtitle}>Choisis un nouveau mot de passe pour ton compte Xpertiv.</p>
        <form onSubmit={submit}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <input
            style={styles.input}
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label style={styles.label}>Confirmer le mot de passe</label>
          <input
            style={styles.input}
            type="password"
            minLength={6}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.message}>{message}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
