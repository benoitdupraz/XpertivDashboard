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
  link: {
    background: "none",
    border: "none",
    color: "#33587A",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  error: { color: "#A64B42", fontSize: 12.5, marginBottom: 12 },
  message: { color: "#1D6E64", fontSize: 12.5, marginBottom: 12 },
};

function traduireErreur(msg) {
  if (!msg) return "Une erreur est survenue.";
  if (msg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (msg.includes("User already registered")) return "Un compte existe déjà avec cet email.";
  if (msg.includes("Password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (msg.includes("Email not confirmed")) return "Merci de confirmer ton email avant de te connecter.";
  return msg;
}

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setError("");
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(traduireErreur(error.message));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user && nom.trim()) {
      await supabase.from("profiles").update({ nom: nom.trim() }).eq("id", data.user.id);
    }
    setLoading(false);
    if (error) {
      setError(traduireErreur(error.message));
    } else {
      setMessage("Compte créé. Un administrateur doit valider ton accès avant que tu puisses te connecter.");
      setMode("login");
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setLoading(false);
    if (error) setError(traduireErreur(error.message));
    else setMessage("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {mode === "login" && (
          <>
            <h1 style={styles.title}>Xpertiv</h1>
            <p style={styles.subtitle}>Connexion à l'espace ressources & équipements</p>
            <form onSubmit={handleLogin}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label style={styles.label}>Mot de passe</label>
              <input
                style={styles.input}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.message}>{message}</div>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button style={styles.link} onClick={() => { reset(); setMode("signup"); }}>
                Créer un compte
              </button>
              <button style={styles.link} onClick={() => { reset(); setMode("forgot"); }}>
                Mot de passe oublié ?
              </button>
            </div>
          </>
        )}

        {mode === "signup" && (
          <>
            <h1 style={styles.title}>Créer un compte</h1>
            <p style={styles.subtitle}>Ton accès devra être validé par un administrateur avant utilisation.</p>
            <form onSubmit={handleSignup}>
              <label style={styles.label}>Nom</label>
              <input style={styles.input} required value={nom} onChange={(e) => setNom(e.target.value)} />
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label style={styles.label}>Mot de passe</label>
              <input
                style={styles.input}
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <div style={styles.error}>{error}</div>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Création…" : "Créer mon compte"}
              </button>
            </form>
            <div style={{ marginTop: 16 }}>
              <button style={styles.link} onClick={() => { reset(); setMode("login"); }}>
                ← Retour à la connexion
              </button>
            </div>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h1 style={styles.title}>Mot de passe oublié</h1>
            <p style={styles.subtitle}>Un lien de réinitialisation te sera envoyé par email.</p>
            <form onSubmit={handleForgot}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <div style={styles.error}>{error}</div>}
              {message && <div style={styles.message}>{message}</div>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le lien"}
              </button>
            </form>
            <div style={{ marginTop: 16 }}>
              <button style={styles.link} onClick={() => { reset(); setMode("login"); }}>
                ← Retour à la connexion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
