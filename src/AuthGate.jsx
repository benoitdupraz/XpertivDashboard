import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./Auth.jsx";
import ResetPassword from "./ResetPassword.jsx";
import PendingApproval from "./PendingApproval.jsx";
import AdminUsers from "./AdminUsers.jsx";
import App from "./App.jsx";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EEF1F4", color: "#5C6B7A", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", fontSize: 13.5 }}>
      Chargement…
    </div>
  );
}

function TopBar({ profile, view, setView, onLogout }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        background: "#1B2430",
        color: "#fff",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}>Xpertiv</span>
        {profile.role === "admin" && (
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", padding: 3, borderRadius: 7 }}>
            <button
              onClick={() => setView("app")}
              style={{
                border: "none",
                background: view === "app" ? "#fff" : "transparent",
                color: view === "app" ? "#1B2430" : "#C9D2DC",
                padding: "5px 10px",
                borderRadius: 5,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Application
            </button>
            <button
              onClick={() => setView("admin")}
              style={{
                border: "none",
                background: view === "admin" ? "#fff" : "transparent",
                color: view === "admin" ? "#1B2430" : "#C9D2DC",
                padding: "5px 10px",
                borderRadius: 5,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Utilisateurs
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: "#C9D2DC" }}>{profile.nom || profile.email}</span>
        <button
          onClick={onLogout}
          style={{
            border: "1px solid rgba(255,255,255,0.25)",
            background: "transparent",
            color: "#fff",
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AuthGate() {
  const [session, setSession] = useState(undefined); // undefined = pas encore chargé
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [view, setView] = useState("app");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data);
          setProfileLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (recoveryMode) {
    return <ResetPassword onDone={() => setRecoveryMode(false)} />;
  }

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Auth />;
  if (profileLoading || !profile) return <LoadingScreen />;

  if (!profile.approved) {
    return <PendingApproval email={profile.email} onLogout={() => supabase.auth.signOut()} />;
  }

  return (
    <div>
      <TopBar profile={profile} view={view} setView={setView} onLogout={() => supabase.auth.signOut()} />
      {view === "admin" && profile.role === "admin" ? <AdminUsers /> : <App />}
    </div>
  );
}
