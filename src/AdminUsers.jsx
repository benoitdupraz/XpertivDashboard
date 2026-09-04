import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const charger = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) setError(error.message);
    else setProfiles(data || []);
  };

  useEffect(() => {
    charger();
  }, []);

  const approuver = async (id) => {
    await supabase.from("profiles").update({ approved: true }).eq("id", id);
    charger();
  };

  const revoquer = async (id) => {
    await supabase.from("profiles").update({ approved: false }).eq("id", id);
    charger();
  };

  const enAttente = profiles.filter((p) => !p.approved);
  const approuves = profiles.filter((p) => p.approved);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <h1
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: "#1B2430",
          fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          marginBottom: 18,
        }}
      >
        Gestion des accès
      </h1>

      {error && <div style={{ color: "#A64B42", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      {loading ? (
        <div style={{ color: "#5C6B7A", fontSize: 13 }}>Chargement…</div>
      ) : (
        <>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
            En attente ({enAttente.length})
          </h2>
          {enAttente.length === 0 ? (
            <p style={{ fontSize: 13, color: "#8B96A3", marginBottom: 24 }}>Aucune demande en attente.</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {enAttente.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #E1E5E9",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 8,
                    background: "#FFFFFF",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1B2430" }}>{p.nom || "(nom non renseigné)"}</div>
                    <div style={{ fontSize: 12, color: "#8B96A3" }}>{p.email}</div>
                  </div>
                  <button
                    onClick={() => approuver(p.id)}
                    style={{
                      background: "#1B2430",
                      color: "#fff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approuver
                  </button>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
            Comptes actifs ({approuves.length})
          </h2>
          {approuves.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #E1E5E9",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 8,
                background: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1B2430" }}>
                  {p.nom || "(nom non renseigné)"} {p.role === "admin" && <span style={{ color: "#33587A", fontSize: 11 }}>· admin</span>}
                </div>
                <div style={{ fontSize: 12, color: "#8B96A3" }}>{p.email}</div>
              </div>
              {p.role !== "admin" && (
                <button
                  onClick={() => revoquer(p.id)}
                  style={{
                    background: "transparent",
                    color: "#A64B42",
                    border: "1px solid #D7DCE1",
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Révoquer l'accès
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
