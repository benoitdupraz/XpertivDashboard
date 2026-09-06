import React, { useState, useEffect, useMemo } from "react";
import { storage } from "./storage.js";
import {
  Monitor,
  Car,
  Users,
  Plus,
  Search,
  X,
  UserPlus,
  Pencil,
  Trash2,
  History,
  Archive,
  TriangleAlert,
  Loader2,
  UserX,
  UserCheck,
  Laptop,
  Cake,
  Mail,
  Phone,
  Eye,
  Sparkles,
  PartyPopper,
  UserRound,
  RotateCcw,
  Gauge,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";

/* ---------------------------------- constantes ---------------------------------- */

const ETATS_POSTE = ["Disponible", "Attribué", "Retiré"];
const ETATS_VOITURE = ["Disponible", "Attribuée", "Retirée"];
const PROFILS = ["Technique", "Fonctionnel"];
const TYPES_CONTRAT_VOITURE = ["LLD", "LOA", "Achat", "Autre"];

const POSTE_ETAT_STYLES = {
  "Disponible": { fg: "#1D6E64", bg: "#E4F1EE", dot: "#1D6E64" },
  "Attribué": { fg: "#33587A", bg: "#E7EEF4", dot: "#33587A" },
  "Retiré": { fg: "#8A3A32", bg: "#F6E7E5", dot: "#A64B42" },
};

const VOITURE_ETAT_STYLES = {
  "Disponible": { fg: "#1D6E64", bg: "#E4F1EE", dot: "#1D6E64" },
  "Attribuée": { fg: "#33587A", bg: "#E7EEF4", dot: "#33587A" },
  "Retirée": { fg: "#8A3A32", bg: "#F6E7E5", dot: "#A64B42" },
};

const STATUT_EMPLOYE_STYLES = {
  "Actif": { fg: "#1D6E64", bg: "#E4F1EE", dot: "#1D6E64" },
  "Inactif": { fg: "#6B7280", bg: "#EDEEF0", dot: "#9AA1AA" },
};

const PROFIL_STYLES = {
  "Technique": { fg: "#33587A", bg: "#E7EEF4" },
  "Fonctionnel": { fg: "#6B4C8A", bg: "#EEE7F3" },
};

const CONTRAT_TYPE_STYLES = {
  "LLD": { fg: "#33587A", bg: "#E7EEF4" },
  "LOA": { fg: "#6B4C8A", bg: "#EEE7F3" },
  "Achat": { fg: "#1D6E64", bg: "#E4F1EE" },
  "Autre": { fg: "#5C6B7A", bg: "#EDEEF0" },
};

const MODULE_SUGGESTIONS = ["Finance", "RH", "Achats", "Logistique", "CRM", "Production", "Paie"];

const STORAGE_KEYS = {
  employes: "xpertiv:employes",
  postes: "xpertiv:postes",
  voitures: "xpertiv:voitures",
  historiqueModifications: "xpertiv:historiqueModifications",
};

/* ---------------------------------- helpers ---------------------------------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d + "T00:00:00");
  if (isNaN(dt)) return typeof d === "string" ? d : "—";
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysSince(d) {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  return Math.floor((Date.now() - dt.getTime()) / 86400000);
}

function anciennete(d) {
  const days = daysSince(d);
  if (days === null) return "—";
  if (days < 31) return `${days} j`;
  const months = Math.floor(days / 30.4);
  if (months < 24) return `${months} mois`;
  return `${(months / 12).toFixed(1)} ans`;
}

function formatDateCourt(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d + "T00:00:00");
  if (isNaN(dt)) return typeof d === "string" ? d : "—";
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatEuros(n) {
  if (n === null || n === undefined || n === "" || n === 0) return null;
  return Number(n).toLocaleString("fr-FR") + " €";
}

function resumeFinancierVoiture(v) {
  if (v.typeContrat === "LLD" && v.loyerMensuel) {
    return `${formatEuros(v.loyerMensuel)} / mois`;
  }
  if (v.typeContrat === "LOA" && (v.loyerMensuel || v.optionAchat)) {
    const parts = [];
    if (v.loyerMensuel) parts.push(`${formatEuros(v.loyerMensuel)} / mois`);
    if (v.optionAchat) parts.push(`option d'achat ${formatEuros(v.optionAchat)}`);
    return parts.join(" · ");
  }
  if (v.typeContrat === "Achat" && v.prixAchat) {
    return `Achat : ${formatEuros(v.prixAchat)}`;
  }
  return null;
}

function garantieEffective(poste) {
  const dateEffective = poste.garantieEtendue && poste.dateFinGarantieEtendue ? poste.dateFinGarantieEtendue : poste.dateFinGarantie;
  if (!dateEffective) return { date: null, active: null };
  return { date: dateEffective, active: dateEffective >= todayISO() };
}

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance + "T00:00:00");
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function prochaineOccurrence(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return next;
}

function joursAvant(dateObj) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dateObj - today) / 86400000);
}

function libelleEcheance(jours) {
  if (jours === 0) return "aujourd'hui";
  if (jours === 1) return "demain";
  return `dans ${jours} j`;
}

function estActif(employe) {
  return !employe.dateFinContrat || employe.dateFinContrat > todayISO();
}

function statutDe(employe) {
  return estActif(employe) ? "Actif" : "Inactif";
}

function nomComplet(employe) {
  return [employe.prenom, employe.nom].filter(Boolean).join(" ") || "—";
}

function formatDateHeure(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return (
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

const CHAMPS_MASQUES = ["bitlockerCle"];

const EMPLOYE_CHAMP_LABELS = {
  prenom: "Prénom",
  nom: "Nom",
  matricule: "Matricule",
  dateDebut: "Début de contrat",
  dateNaissance: "Date de naissance",
  emailPro: "Email pro",
  emailPerso: "Email perso",
  telephone: "Téléphone",
  dateFinContrat: "Fin de contrat",
  profil: "Profil",
  modules: "Modules",
  contactUrgenceNom: "Contact d'urgence (nom)",
  contactUrgenceLien: "Contact d'urgence (lien)",
  contactUrgenceTelephone: "Contact d'urgence (téléphone)",
};

const POSTE_CHAMP_LABELS = {
  marque: "Marque",
  modele: "Modèle",
  numeroSerie: "N° de série",
  nomPC: "Nom du PC",
  dateAchat: "Date d'achat",
  dateFinGarantie: "Fin de garantie constructeur",
  garantieEtendue: "Garantie étendue",
  dateFinGarantieEtendue: "Fin de garantie étendue",
  bitlockerCle: "Clé BitLocker",
};

const VOITURE_CHAMP_LABELS = {
  marque: "Marque",
  modele: "Modèle",
  immatriculation: "Immatriculation",
  typeContrat: "Type de contrat",
  dateDebutContrat: "Début de contrat",
  dateFinContrat: "Fin de contrat",
  loyerMensuel: "Loyer mensuel",
  optionAchat: "Option d'achat",
  prixAchat: "Prix d'achat",
  kmContractuel: "Kilométrage contractuel",
  kmReel: "Kilométrage réel",
};

function valeurAffichable(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (v === true) return "Oui";
  if (v === false) return "Non";
  return String(v);
}

function diffChamps(avant, apres, labels) {
  const diffs = [];
  Object.keys(labels).forEach((key) => {
    const av = avant ? avant[key] : undefined;
    const ap = apres[key];
    const avStr = Array.isArray(av) ? av.join(", ") : String(av ?? "");
    const apStr = Array.isArray(ap) ? ap.join(", ") : String(ap ?? "");
    if (avStr !== apStr) {
      const masque = CHAMPS_MASQUES.includes(key);
      diffs.push({
        champ: labels[key],
        ancienneValeur: masque ? (avStr ? "••••••" : "—") : valeurAffichable(av),
        nouvelleValeur: masque ? (apStr ? "••••••" : "—") : valeurAffichable(ap),
      });
    }
  });
  return diffs;
}

const AVATAR_PALETTE = [
  { bg: "#E7EEF4", fg: "#33587A" },
  { bg: "#EEE7F3", fg: "#6B4C8A" },
  { bg: "#E4F1EE", fg: "#1D6E64" },
  { bg: "#FBEEDD", fg: "#9A5B15" },
  { bg: "#F6E7E5", fg: "#8A3A32" },
  { bg: "#E9EEF7", fg: "#3D5A80" },
];

function avatarStyle(nom) {
  const sum = (nom || "?").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

function initiales(nom) {
  if (!nom) return "?";
  const parts = nom.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Avatar({ nom, size = 34 }) {
  const s = avatarStyle(nom);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: s.bg,
        color: s.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: "var(--font-display)",
        flexShrink: 0,
      }}
    >
      {initiales(nom)}
    </div>
  );
}

/* ---------------------------------- données d'exemple ---------------------------------- */

function genererMatricule(employes) {
  const max = employes.reduce((acc, e) => {
    const n = parseInt(e.matricule, 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return String(max + 1).padStart(5, "0");
}

function matriculeValide(m) {
  return /^\d{5}$/.test(m);
}

const SEED_EMPLOYES = [
  {
    id: "emp-1",
    prenom: "Camille",
    nom: "Robert",
    matricule: "00001",
    dateDebut: "2024-03-01",
    dateNaissance: "1994-09-02",
    emailPro: "camille.robert@xpertiv.fr",
    emailPerso: "camille.robert@gmail.com",
    telephone: "06 12 34 56 78",
    profil: "Technique",
    modules: [],
    dateFinContrat: null,
    contactUrgenceNom: "Marc Robert",
    contactUrgenceLien: "Conjoint",
    contactUrgenceTelephone: "06 11 22 33 44",
  },
  {
    id: "emp-2",
    prenom: "Nadia",
    nom: "Ferreira",
    matricule: "00002",
    dateDebut: "2023-09-20",
    dateNaissance: "1990-01-14",
    emailPro: "nadia.ferreira@xpertiv.fr",
    emailPerso: "nadia.ferreira@outlook.com",
    telephone: "06 98 76 54 32",
    profil: "Fonctionnel",
    modules: ["Finance", "Paie"],
    dateFinContrat: null,
    contactUrgenceNom: "Sofia Ferreira",
    contactUrgenceLien: "Sœur",
    contactUrgenceTelephone: "06 22 33 44 55",
  },
  {
    id: "emp-3",
    prenom: "Julien",
    nom: "Massé",
    matricule: "00003",
    dateDebut: "2022-11-10",
    dateNaissance: "1988-06-23",
    emailPro: "julien.masse@xpertiv.fr",
    emailPerso: "julien.masse@yahoo.fr",
    telephone: "06 45 67 89 10",
    profil: "Technique",
    modules: [],
    dateFinContrat: "2026-08-12",
    contactUrgenceNom: "",
    contactUrgenceLien: "",
    contactUrgenceTelephone: "",
  },
];

const SEED_POSTES = [
  {
    id: uid(),
    marque: "Dell",
    modele: "Latitude 7440",
    numeroSerie: "DL7440-2201",
    nomPC: "CPTA-PC-014",
    dateAchat: "2024-02-10",
    dateFinGarantie: "2027-02-10",
    garantieEtendue: false,
    dateFinGarantieEtendue: null,
    bitlockerCle: "482910-663215-091847-720536-118293-405672-891034-267510",
    dateRetrait: null,
    etat: "Attribué",
    assignation: { employeId: "emp-1", employeNom: "Camille Robert", dateAttribution: "2024-03-01" },
    historique: [],
  },
  {
    id: uid(),
    marque: "Apple",
    modele: 'MacBook Pro 14"',
    numeroSerie: "APL-MBP14-0091",
    nomPC: "DESIGN-MAC-03",
    dateAchat: "2023-09-18",
    dateFinGarantie: "2024-09-18",
    garantieEtendue: true,
    dateFinGarantieEtendue: "2026-09-18",
    bitlockerCle: "",
    dateRetrait: null,
    etat: "Disponible",
    assignation: null,
    historique: [
      { employeId: "emp-2", employeNom: "Nadia Ferreira", dateAttribution: "2023-09-20", dateDesattribution: "2025-06-01" },
    ],
  },
  {
    id: uid(),
    marque: "Lenovo",
    modele: "ThinkPad T14",
    numeroSerie: "LN-T14-3387",
    nomPC: "SUPPORT-PC-007",
    dateAchat: "2022-11-05",
    dateFinGarantie: "2025-11-05",
    garantieEtendue: false,
    dateFinGarantieEtendue: null,
    bitlockerCle: "739184-205671-843092-561728-390465-172058-624790-081356",
    dateRetrait: null,
    etat: "Disponible",
    assignation: null,
    historique: [
      { employeId: "emp-3", employeNom: "Julien Massé", dateAttribution: "2022-11-10", dateDesattribution: "2026-08-12" },
    ],
  },
];

const SEED_VOITURES = [
  {
    id: uid(),
    marque: "Peugeot",
    modele: "308",
    immatriculation: "AB-123-CD",
    typeContrat: "LLD",
    dateDebutContrat: "2023-05-02",
    dateFinContrat: "2027-05-02",
    loyerMensuel: 420,
    optionAchat: null,
    prixAchat: null,
    kmContractuel: 60000,
    kmReel: 38500,
    dateRetrait: null,
    etat: "Attribuée",
    assignation: { employeId: "emp-1", employeNom: "Camille Robert", dateAttribution: "2024-03-01" },
    historique: [],
  },
  {
    id: uid(),
    marque: "Renault",
    modele: "Clio",
    immatriculation: "EF-456-GH",
    typeContrat: "LOA",
    dateDebutContrat: "2022-01-15",
    dateFinContrat: "2026-01-15",
    loyerMensuel: 280,
    optionAchat: 6500,
    prixAchat: null,
    kmContractuel: 45000,
    kmReel: 47200,
    dateRetrait: null,
    etat: "Disponible",
    assignation: null,
    historique: [
      { employeId: "emp-3", employeNom: "Julien Massé", dateAttribution: "2022-11-10", dateDesattribution: "2026-08-12" },
    ],
  },
];

/* ---------------------------------- UI de base ---------------------------------- */

const iconBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#5C6B7A",
  width: 28,
  height: 28,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid #D7DCE1",
  fontSize: 13.5,
  color: "#1B2430",
  background: "#FBFCFD",
  outline: "none",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#5C6B7A",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function PrimaryButton({ children, onClick, type = "button", full, danger, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#B7BFC7" : danger ? "#A64B42" : "#1B2430",
        color: "#fff",
        border: "none",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 13.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, full }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: "#5C6B7A",
        border: "1px solid #D7DCE1",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        width: full ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}

function SmallActionButton({ icon, label, onClick, tone = "default" }) {
  const colors = {
    default: "#5C6B7A",
    danger: "#A64B42",
    primary: "#33587A",
  };
  return (
    <button
      title={label}
      onClick={onClick}
      style={{ ...iconBtnStyle, color: colors[tone] }}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E1E5E9",
        borderRadius: 12,
        padding: "14px 16px",
        flex: 1,
        minWidth: 130,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1B2430", fontFamily: "var(--font-display)" }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: "#5C6B7A", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

function Pill({ label, styleMap }) {
  const s = styleMap[label] || { fg: "#5C6B7A", bg: "#EDEEF0", dot: "#9AA1AA" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "4px 9px 4px 7px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function Badge({ label, styleMap }) {
  const s = styleMap[label] || { fg: "#5C6B7A", bg: "#EDEEF0" };
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function KmGauge({ kmReel, kmContractuel, width = 150 }) {
  if (!kmContractuel) {
    return <span style={{ fontSize: 12, color: "#B7BFC7" }}>Non renseigné</span>;
  }
  const pct = Math.round(((kmReel || 0) / kmContractuel) * 100);
  const barWidth = Math.min(pct, 100);
  const delta = kmContractuel - (kmReel || 0);
  let color, label;
  if (pct < 85) {
    color = "#1D6E64";
    label = "Dans les clous";
  } else if (pct <= 100) {
    color = "#C67C2E";
    label = "À surveiller";
  } else {
    color = "#A64B42";
    label = "Dépassement";
  }
  return (
    <div style={{ minWidth: width }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5C6B7A", marginBottom: 3 }}>
        <span>{(kmReel || 0).toLocaleString("fr-FR")} km</span>
        <span>{kmContractuel.toLocaleString("fr-FR")} km</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#EDEFF1", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${barWidth}%`, background: color, borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 10.5, color, marginTop: 3, fontWeight: 600 }}>
        {label} · {delta >= 0 ? `${delta.toLocaleString("fr-FR")} km restants` : `${Math.abs(delta).toLocaleString("fr-FR")} km au-delà`}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#F0F2F4",
        color: "#5C6B7A",
        fontSize: 11,
        padding: "2px 7px",
        borderRadius: 5,
        marginRight: 4,
        marginTop: 3,
      }}
    >
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 26, 33, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: width,
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #D7DCE1",
          boxShadow: "0 24px 60px rgba(20,30,40,0.25)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E9ECEF",
            position: "sticky",
            top: 0,
            background: "#FFFFFF",
            borderRadius: "14px 14px 0 0",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1B2430", fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel = "Confirmer", danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width={380}>
      <p style={{ fontSize: 13.5, color: "#3A4453", marginTop: 0, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full danger={danger} onClick={onConfirm}>{confirmLabel}</PrimaryButton>
      </div>
    </Modal>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div
      style={{
        border: "1px dashed #D7DCE1",
        borderRadius: 12,
        padding: "48px 20px",
        textAlign: "center",
        color: "#5C6B7A",
        background: "#FBFCFD",
      }}
    >
      <div style={{ marginBottom: 8, opacity: 0.5, display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 13.5 }}>{text}</div>
    </div>
  );
}

function ModuleTagInput({ value, onChange }) {
  const [text, setText] = useState("");

  const add = (m) => {
    const clean = m.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setText("");
  };

  const remove = (m) => onChange(value.filter((x) => x !== m));

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          border: "1px solid #D7DCE1",
          borderRadius: 8,
          padding: "7px 8px",
          background: "#FBFCFD",
        }}
      >
        {value.map((m) => (
          <span
            key={m}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#EEE7F3",
              color: "#6B4C8A",
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 4px 3px 9px",
              borderRadius: 999,
            }}
          >
            {m}
            <button
              onClick={() => remove(m)}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6B4C8A", display: "flex", padding: 2 }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder={value.length === 0 ? "Ajouter un module puis Entrée…" : "Ajouter…"}
          style={{
            flex: 1,
            minWidth: 100,
            border: "none",
            outline: "none",
            fontSize: 13,
            background: "transparent",
            fontFamily: "var(--font-body)",
          }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
        {MODULE_SUGGESTIONS.filter((s) => !value.includes(s)).map((s) => (
          <button
            key={s}
            onClick={() => add(s)}
            style={{
              border: "1px dashed #D7DCE1",
              background: "transparent",
              color: "#8B96A3",
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Générique : attribuer un salarié <-> un actif (poste ou voiture) */
function AssignModal({ title, options, getLabel, getSubLabel, emptyMessage, onAssign, onClose }) {
  const [selectedId, setSelectedId] = useState(options[0]?.id || "");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  if (options.length === 0) {
    return (
      <Modal title={title} onClose={onClose} width={380}>
        <EmptyState icon={<TriangleAlert size={20} />} text={emptyMessage} />
        <div style={{ marginTop: 16 }}>
          <GhostButton full onClick={onClose}>Fermer</GhostButton>
        </div>
      </Modal>
    );
  }

  const submit = () => {
    if (!selectedId) {
      setError("Sélectionnez une option.");
      return;
    }
    onAssign(selectedId, date);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Sélection">
        <select style={{ ...inputStyle, cursor: "pointer" }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {getLabel(o)}
            </option>
          ))}
        </select>
        {getSubLabel && (
          <div style={{ fontSize: 11.5, color: "#8B96A3", marginTop: 4 }}>
            {getSubLabel(options.find((o) => o.id === selectedId))}
          </div>
        )}
      </Field>
      <Field label="Date d'attribution">
        <input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {error && <div style={{ color: "#A64B42", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full onClick={submit}>Attribuer</PrimaryButton>
      </div>
    </Modal>
  );
}

function CorpsModifications({ entries }) {
  const tries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (tries.length === 0) {
    return <EmptyState icon={<ClipboardList size={20} />} text="Aucune modification enregistrée pour le moment." />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 380, overflowY: "auto" }}>
      {tries.map((m) => (
        <div key={m.id} style={{ border: "1px solid #E1E5E9", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8B96A3", marginBottom: 5 }}>
            <span>{formatDateHeure(m.date)}</span>
            <span style={{ fontWeight: 600 }}>{m.responsable}</span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1B2430", marginBottom: 2 }}>{m.champ}</div>
          <div style={{ fontSize: 12.5, color: "#5C6B7A" }}>
            <span style={{ textDecoration: "line-through", color: "#B7BFC7" }}>{m.ancienneValeur}</span>
            {" → "}
            <span style={{ color: "#1B2430", fontWeight: 500 }}>{m.nouvelleValeur}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModificationsHistoryModal({ title, entries, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width={560}>
      <CorpsModifications entries={entries} />
      <div style={{ marginTop: 16 }}>
        <GhostButton full onClick={onClose}>Fermer</GhostButton>
      </div>
    </Modal>
  );
}

function CorpsAttributions({ subtitle, current, historique }) {
  const entries = [...historique].reverse();
  return (
    <>
      {subtitle && (
        <div style={{ fontSize: 11.5, color: "#8B96A3", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{subtitle}</div>
      )}
      {current && (
        <div
          style={{
            border: "1px solid #E1E5E9",
            borderLeft: "3px solid #33587A",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 10,
            background: "#F8FAFB",
          }}
        >
          <div style={{ fontSize: 11, color: "#33587A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            En cours
          </div>
          <div style={{ fontWeight: 600, color: "#1B2430", marginTop: 2 }}>{current.employeNom}</div>
          <div style={{ fontSize: 12, color: "#5C6B7A" }}>depuis le {formatDate(current.dateAttribution)}</div>
        </div>
      )}
      {entries.length === 0 && !current ? (
        <div style={{ color: "#8B96A3", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          Aucune attribution enregistrée.
        </div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {entries.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: "1px dashed #E1E5E9" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D7DCE1", marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: "#1B2430", fontSize: 13 }}>{h.employeNom}</div>
                <div style={{ fontSize: 11.5, color: "#8B96A3", marginTop: 1 }}>
                  {formatDate(h.dateAttribution)} → {formatDate(h.dateDesattribution)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        background: active ? "#FFFFFF" : "transparent",
        color: active ? "#1B2430" : "#5C6B7A",
        fontSize: 12.5,
        fontWeight: 600,
        padding: "7px 10px",
        borderRadius: 6,
        cursor: "pointer",
        boxShadow: active ? "0 1px 3px rgba(20,30,40,0.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function HistoriqueCombineModal({ title, subtitle, current, historiqueAttribution, modifications, onClose }) {
  const [tab, setTab] = useState("attributions");
  return (
    <Modal title={title} onClose={onClose} width={560}>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#EEF1F4",
          padding: 4,
          borderRadius: 9,
          marginBottom: 16,
        }}
      >
        <TabButton active={tab === "attributions"} onClick={() => setTab("attributions")}>
          Attributions
        </TabButton>
        <TabButton active={tab === "modifications"} onClick={() => setTab("modifications")}>
          Modifications{modifications.length > 0 ? ` (${modifications.length})` : ""}
        </TabButton>
      </div>

      {tab === "attributions" ? (
        <CorpsAttributions subtitle={subtitle} current={current} historique={historiqueAttribution} />
      ) : (
        <CorpsModifications entries={modifications} />
      )}

      <div style={{ marginTop: 16 }}>
        <GhostButton full onClick={onClose}>Fermer</GhostButton>
      </div>
    </Modal>
  );
}

/* ---------------------------------- App racine ---------------------------------- */

export default function App({ currentUser } = {}) {
  const [tab, setTab] = useState("salaries");
  const [employes, setEmployes] = useState([]);
  const [postes, setPostes] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const nomResponsable = currentUser?.nom || currentUser?.email || "Utilisateur";

  useEffect(() => {
    (async () => {
      const usingClaudeStorage = typeof window !== "undefined" && !!window.storage;
      const load = async (key, seed) => {
        try {
          const res = await storage.get(key, false);
          return res && res.value ? JSON.parse(res.value) : seed;
        } catch (e) {
          // En dehors de Claude (déploiement réel), une clé absente signifie
          // une base réellement vide — jamais les données de démonstration.
          return usingClaudeStorage ? seed : [];
        }
      };
      const [e, p, v, h] = await Promise.all([
        load(STORAGE_KEYS.employes, SEED_EMPLOYES),
        load(STORAGE_KEYS.postes, SEED_POSTES),
        load(STORAGE_KEYS.voitures, SEED_VOITURES),
        load(STORAGE_KEYS.historiqueModifications, []),
      ]);
      setEmployes(e);
      setPostes(p);
      setVoitures(v);
      setHistorique(h);
      setLoaded(true);
    })();
  }, []);

  const persist = async (key, value, setter) => {
    setter(value);
    try {
      const res = await storage.set(key, JSON.stringify(value), false);
      if (!res) throw new Error("no result");
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  };

  const persistHistorique = (next) => persist(STORAGE_KEYS.historiqueModifications, next, setHistorique);

  const enregistrerModification = (entite, entiteId, entiteLabel, champs) => {
    if (!champs || champs.length === 0) return;
    const maintenant = new Date().toISOString();
    const nouvelles = champs.map((c) => ({
      id: uid(),
      date: maintenant,
      entite,
      entiteId,
      entiteLabel,
      responsable: nomResponsable,
      champ: c.champ,
      ancienneValeur: c.ancienneValeur,
      nouvelleValeur: c.nouvelleValeur,
    }));
    persistHistorique([...historique, ...nouvelles]);
  };

  const persistEmployes = (next) => persist(STORAGE_KEYS.employes, next, setEmployes);
  const persistPostes = (next) => persist(STORAGE_KEYS.postes, next, setPostes);
  const persistVoitures = (next) => persist(STORAGE_KEYS.voitures, next, setVoitures);

  /* ---- logique d'attribution poste ---- */

  const assignPoste = (posteId, employeId, date) => {
    const employe = employes.find((e) => e.id === employeId);
    const nom = employe ? nomComplet(employe) : "Salarié inconnu";
    const poste = postes.find((p) => p.id === posteId);
    persistPostes(
      postes.map((p) => {
        if (p.id !== posteId) return p;
        const hist = [...p.historique];
        if (p.assignation) hist.push({ ...p.assignation, dateDesattribution: date });
        return { ...p, etat: "Attribué", assignation: { employeId, employeNom: nom, dateAttribution: date }, historique: hist };
      })
    );
    if (poste) {
      enregistrerModification("poste", posteId, `${poste.marque} ${poste.modele}`, [
        { champ: "Attribution", ancienneValeur: poste.assignation ? poste.assignation.employeNom : "Disponible", nouvelleValeur: nom },
      ]);
    }
  };

  const returnPoste = (posteId, dateDesattribution = todayISO()) => {
    const poste = postes.find((p) => p.id === posteId);
    persistPostes(
      postes.map((p) => {
        if (p.id !== posteId || !p.assignation) return p;
        return { ...p, etat: "Disponible", assignation: null, historique: [...p.historique, { ...p.assignation, dateDesattribution }] };
      })
    );
    if (poste?.assignation) {
      enregistrerModification("poste", posteId, `${poste.marque} ${poste.modele}`, [
        { champ: "Attribution", ancienneValeur: poste.assignation.employeNom, nouvelleValeur: "Disponible" },
      ]);
    }
  };

  const setPosteEtat = (posteId, etat) => {
    const poste = postes.find((p) => p.id === posteId);
    persistPostes(
      postes.map((p) => {
        if (p.id !== posteId) return p;
        let next = { ...p, etat };
        if (etat !== "Attribué" && p.assignation) {
          next.assignation = null;
          next.historique = [...p.historique, { ...p.assignation, dateDesattribution: todayISO() }];
        }
        if (etat === "Retiré") {
          next.dateRetrait = todayISO();
        } else if (p.etat === "Retiré" && etat !== "Retiré") {
          next.dateRetrait = null;
        }
        return next;
      })
    );
    if (poste && poste.etat !== etat) {
      enregistrerModification("poste", posteId, `${poste.marque} ${poste.modele}`, [
        { champ: "État", ancienneValeur: poste.etat, nouvelleValeur: etat },
      ]);
    }
  };

  const savePoste = (data, id) => {
    if (id) {
      const avant = postes.find((p) => p.id === id);
      const fusion = { ...avant, ...data };
      const diffs = diffChamps(avant, fusion, POSTE_CHAMP_LABELS);
      persistPostes(postes.map((p) => (p.id === id ? fusion : p)));
      enregistrerModification("poste", id, `${fusion.marque} ${fusion.modele}`, diffs);
    } else {
      const newId = uid();
      persistPostes([
        ...postes,
        { id: newId, ...data, etat: "Disponible", dateRetrait: null, assignation: null, historique: [] },
      ]);
      enregistrerModification("poste", newId, `${data.marque} ${data.modele}`, [
        { champ: "Création", ancienneValeur: "—", nouvelleValeur: "Poste ajouté au parc" },
      ]);
    }
  };

  const deletePoste = (id) => persistPostes(postes.filter((p) => p.id !== id));

  /* ---- logique d'attribution voiture ---- */

  const assignVoiture = (voitureId, employeId, date) => {
    const employe = employes.find((e) => e.id === employeId);
    const nom = employe ? nomComplet(employe) : "Salarié inconnu";
    const voiture = voitures.find((v) => v.id === voitureId);
    persistVoitures(
      voitures.map((v) => {
        if (v.id !== voitureId) return v;
        const hist = [...v.historique];
        if (v.assignation) hist.push({ ...v.assignation, dateDesattribution: date });
        return { ...v, etat: "Attribuée", assignation: { employeId, employeNom: nom, dateAttribution: date }, historique: hist };
      })
    );
    if (voiture) {
      enregistrerModification("voiture", voitureId, `${voiture.marque} ${voiture.modele}`, [
        { champ: "Attribution", ancienneValeur: voiture.assignation ? voiture.assignation.employeNom : "Disponible", nouvelleValeur: nom },
      ]);
    }
  };

  const returnVoiture = (voitureId, dateDesattribution = todayISO()) => {
    const voiture = voitures.find((v) => v.id === voitureId);
    persistVoitures(
      voitures.map((v) => {
        if (v.id !== voitureId || !v.assignation) return v;
        return { ...v, etat: "Disponible", assignation: null, historique: [...v.historique, { ...v.assignation, dateDesattribution }] };
      })
    );
    if (voiture?.assignation) {
      enregistrerModification("voiture", voitureId, `${voiture.marque} ${voiture.modele}`, [
        { champ: "Attribution", ancienneValeur: voiture.assignation.employeNom, nouvelleValeur: "Disponible" },
      ]);
    }
  };

  const setVoitureEtat = (voitureId, etat) => {
    const voiture = voitures.find((v) => v.id === voitureId);
    persistVoitures(
      voitures.map((v) => {
        if (v.id !== voitureId) return v;
        let next = { ...v, etat };
        if (etat !== "Attribuée" && v.assignation) {
          next.assignation = null;
          next.historique = [...v.historique, { ...v.assignation, dateDesattribution: todayISO() }];
        }
        if (etat === "Retirée") {
          next.dateRetrait = todayISO();
        } else if (v.etat === "Retirée" && etat !== "Retirée") {
          next.dateRetrait = null;
        }
        return next;
      })
    );
    if (voiture && voiture.etat !== etat) {
      enregistrerModification("voiture", voitureId, `${voiture.marque} ${voiture.modele}`, [
        { champ: "État", ancienneValeur: voiture.etat, nouvelleValeur: etat },
      ]);
    }
  };

  const saveVoiture = (data, id) => {
    if (id) {
      const avant = voitures.find((v) => v.id === id);
      const fusion = { ...avant, ...data };
      const diffs = diffChamps(avant, fusion, VOITURE_CHAMP_LABELS);
      persistVoitures(voitures.map((v) => (v.id === id ? fusion : v)));
      enregistrerModification("voiture", id, `${fusion.marque} ${fusion.modele}`, diffs);
    } else {
      const newId = uid();
      persistVoitures([
        ...voitures,
        { id: newId, ...data, etat: "Disponible", dateRetrait: null, assignation: null, historique: [] },
      ]);
      enregistrerModification("voiture", newId, `${data.marque} ${data.modele}`, [
        { champ: "Création", ancienneValeur: "—", nouvelleValeur: "Véhicule ajouté à la flotte" },
      ]);
    }
  };

  const deleteVoiture = (id) => persistVoitures(voitures.filter((v) => v.id !== id));

  /* ---- logique salariés ---- */

  const saveEmploye = (data, id) => {
    if (id) {
      const avant = employes.find((e) => e.id === id);
      const fusion = { ...avant, ...data };
      const diffs = diffChamps(avant, fusion, EMPLOYE_CHAMP_LABELS);
      persistEmployes(employes.map((e) => (e.id === id ? fusion : e)));
      enregistrerModification("salarie", id, nomComplet(fusion), diffs);
    } else {
      const newId = uid();
      persistEmployes([...employes, { id: newId, ...data }]);
      enregistrerModification("salarie", newId, nomComplet(data), [
        { champ: "Création", ancienneValeur: "—", nouvelleValeur: "Dossier créé" },
      ]);
    }
  };

  const terminerContrat = (id, dateFinContrat = todayISO()) => {
    const employe = employes.find((e) => e.id === id);
    const posteAssigne = postes.find((p) => p.assignation?.employeId === id);
    const voitureAssignee = voitures.find((v) => v.assignation?.employeId === id);
    if (posteAssigne) returnPoste(posteAssigne.id, dateFinContrat);
    if (voitureAssignee) returnVoiture(voitureAssignee.id, dateFinContrat);
    persistEmployes(employes.map((e) => (e.id === id ? { ...e, dateFinContrat } : e)));
    if (employe) {
      enregistrerModification("salarie", id, nomComplet(employe), [
        { champ: "Statut", ancienneValeur: "Actif", nouvelleValeur: `Inactif (fin de contrat le ${formatDate(dateFinContrat)})` },
      ]);
    }
  };

  const reactiverContrat = (id) => {
    const employe = employes.find((e) => e.id === id);
    persistEmployes(employes.map((e) => (e.id === id ? { ...e, dateFinContrat: null } : e)));
    if (employe) {
      enregistrerModification("salarie", id, nomComplet(employe), [
        { champ: "Statut", ancienneValeur: "Inactif", nouvelleValeur: "Actif" },
      ]);
    }
  };

  const deleteEmploye = (id) => {
    const posteAssigne = postes.find((p) => p.assignation?.employeId === id);
    const voitureAssignee = voitures.find((v) => v.assignation?.employeId === id);
    if (posteAssigne) returnPoste(posteAssigne.id);
    if (voitureAssignee) returnVoiture(voitureAssignee.id);
    persistEmployes(employes.filter((e) => e.id !== id));
  };

  if (!loaded) {
    return (
      <Shell tab={tab} setTab={setTab}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#5C6B7A", gap: 8 }}>
          <Loader2 size={18} className="spin" />
          Chargement…
        </div>
      </Shell>
    );
  }

  return (
    <Shell tab={tab} setTab={setTab}>
      {saveError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F6E7E5",
            color: "#8A3A32",
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 12.5,
            marginBottom: 14,
          }}
        >
          <TriangleAlert size={14} />
          Les dernières modifications n'ont pas pu être enregistrées. Réessayez.
        </div>
      )}

      {tab === "salaries" && (
        <SalariesView
          employes={employes}
          postes={postes}
          voitures={voitures}
          historique={historique}
          saveEmploye={saveEmploye}
          deleteEmploye={deleteEmploye}
          terminerContrat={terminerContrat}
          reactiverContrat={reactiverContrat}
          assignPoste={assignPoste}
          returnPoste={returnPoste}
          assignVoiture={assignVoiture}
          returnVoiture={returnVoiture}
        />
      )}

      {tab === "postes" && (
        <PostesView
          postes={postes}
          employes={employes}
          historique={historique}
          savePoste={savePoste}
          deletePoste={deletePoste}
          assignPoste={assignPoste}
          returnPoste={returnPoste}
          setPosteEtat={setPosteEtat}
        />
      )}

      {tab === "voitures" && (
        <VoituresView
          voitures={voitures}
          employes={employes}
          historique={historique}
          saveVoiture={saveVoiture}
          deleteVoiture={deleteVoiture}
          assignVoiture={assignVoiture}
          returnVoiture={returnVoiture}
          setVoitureEtat={setVoitureEtat}
        />
      )}
    </Shell>
  );
}

/* ---------------------------------- Shell + navigation ---------------------------------- */

function Shell({ tab, setTab, children }) {
  const tabs = [
    { id: "salaries", label: "Salariés", icon: <Users size={15} /> },
    { id: "postes", label: "Postes (PC)", icon: <Monitor size={15} /> },
    { id: "voitures", label: "Véhicules", icon: <Car size={15} /> },
  ];
  return (
    <div
      style={{
        "--font-display": "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        "--font-body": "'Inter', ui-sans-serif, system-ui, sans-serif",
        "--font-mono": "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
        background: "#EEF1F4",
        minHeight: "100vh",
        padding: "28px 20px 60px",
        fontFamily: "var(--font-body)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        table { font-family: var(--font-body); }
        button:hover { opacity: 0.75; }
        select, input { font-family: var(--font-body); }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: #A7B0BA; }
      `}</style>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#1B2430",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Laptop size={17} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1B2430",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.01em",
                }}
              >
                Xpertiv — Ressources & équipements
              </h1>
              <p style={{ margin: 0, fontSize: 12.5, color: "#5C6B7A" }}>
                Salariés, postes de travail et véhicules attribués
              </p>
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: "#E4E8EC",
            padding: 4,
            borderRadius: 10,
            width: "fit-content",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                background: tab === t.id ? "#FFFFFF" : "transparent",
                color: tab === t.id ? "#1B2430" : "#5C6B7A",
                boxShadow: tab === t.id ? "0 1px 3px rgba(20,30,40,0.12)" : "none",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}

/* ---------------------------------- Tableau de bord RH ---------------------------------- */

function HRDashboard({ employesActifs, onOpenFiche }) {
  const anniversairesNaissance = useMemo(() => {
    return employesActifs
      .filter((e) => e.dateNaissance)
      .map((e) => {
        const next = prochaineOccurrence(e.dateNaissance);
        return { employe: e, next, jours: joursAvant(next), age: calculerAge(e.dateNaissance) + (joursAvant(next) === 0 ? 0 : 1) };
      })
      .filter((x) => x.jours <= 45)
      .sort((a, b) => a.jours - b.jours)
      .slice(0, 5);
  }, [employesActifs]);

  const anniversairesEntreprise = useMemo(() => {
    return employesActifs
      .filter((e) => e.dateDebut)
      .map((e) => {
        const debut = new Date(e.dateDebut + "T00:00:00");
        const next = prochaineOccurrence(e.dateDebut);
        const annees = next.getFullYear() - debut.getFullYear();
        return { employe: e, next, jours: joursAvant(next), annees };
      })
      .filter((x) => x.jours <= 45 && x.annees > 0)
      .sort((a, b) => a.jours - b.jours)
      .slice(0, 5);
  }, [employesActifs]);

  const nouveauxArrivants = useMemo(() => {
    return employesActifs
      .filter((e) => e.dateDebut && daysSince(e.dateDebut) >= 0 && daysSince(e.dateDebut) <= 30)
      .map((e) => ({ employe: e, jours: daysSince(e.dateDebut) }))
      .sort((a, b) => a.jours - b.jours)
      .slice(0, 5);
  }, [employesActifs]);

  const rien = anniversairesNaissance.length === 0 && anniversairesEntreprise.length === 0 && nouveauxArrivants.length === 0;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1B2430 0%, #2B3A4F 100%)",
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 20,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -30,
          top: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <Sparkles size={15} color="#F2C572" />
        <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#C9D2DC" }}>
          Tableau de bord RH
        </span>
      </div>

      {rien ? (
        <div style={{ fontSize: 13, color: "#C9D2DC" }}>
          Rien à signaler dans les 45 prochains jours — anniversaires, anniversaires d'entreprise et nouveaux arrivants apparaîtront ici.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <MiniListDark
            icon={<Cake size={14} color="#F2C572" />}
            title="Anniversaires à venir"
            items={anniversairesNaissance}
            emptyText="Aucun dans les 45 prochains jours."
            onOpenFiche={onOpenFiche}
            renderItem={(it) => (
              <>
                <span style={{ fontWeight: 600 }}>{nomComplet(it.employe)}</span>
                <span style={{ color: "#9AA6B5" }}> · {formatDateCourt(it.next)} ({it.age} ans, {libelleEcheance(it.jours)})</span>
              </>
            )}
          />
          <MiniListDark
            icon={<PartyPopper size={14} color="#8FD4C4" />}
            title="Anniversaires d'entreprise"
            items={anniversairesEntreprise}
            emptyText="Aucun dans les 45 prochains jours."
            onOpenFiche={onOpenFiche}
            renderItem={(it) => (
              <>
                <span style={{ fontWeight: 600 }}>{nomComplet(it.employe)}</span>
                <span style={{ color: "#9AA6B5" }}>
                  {" "}
                  · {it.annees} an{it.annees > 1 ? "s" : ""} ({libelleEcheance(it.jours)})
                </span>
              </>
            )}
          />
          <MiniListDark
            icon={<UserPlus size={14} color="#8FB8E0" />}
            title="Nouveaux arrivants"
            items={nouveauxArrivants}
            emptyText="Aucun dans les 30 derniers jours."
            onOpenFiche={onOpenFiche}
            renderItem={(it) => (
              <>
                <span style={{ fontWeight: 600 }}>{nomComplet(it.employe)}</span>
                <span style={{ color: "#9AA6B5" }}> · arrivé{it.jours === 0 ? " aujourd'hui" : ` il y a ${it.jours} j`}</span>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}

function MiniListDark({ icon, title, items, emptyText, renderItem, onOpenFiche }) {
  return (
    <div style={{ flex: "1 1 220px", minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700 }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "#8894A3" }}>{emptyText}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => onOpenFiche(it.employe)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
            >
              <Avatar nom={nomComplet(it.employe)} size={24} />
              <div style={{ fontSize: 12.5, color: "#E7EBEF", lineHeight: 1.3 }}>{renderItem(it)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Vue Salariés ---------------------------------- */

function SalariesView({
  employes,
  postes,
  voitures,
  historique,
  saveEmploye,
  deleteEmploye,
  terminerContrat,
  reactiverContrat,
  assignPoste,
  returnPoste,
  assignVoiture,
  returnVoiture,
}) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Actif");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [ficheFor, setFicheFor] = useState(null);

  const posteOf = (employeId) => postes.find((p) => p.assignation?.employeId === employeId);
  const voitureOf = (employeId) => voitures.find((v) => v.assignation?.employeId === employeId);

  const stats = useMemo(() => {
    const actifs = employes.filter(estActif).length;
    const techniques = employes.filter((e) => estActif(e) && e.profil === "Technique").length;
    const fonctionnels = employes.filter((e) => estActif(e) && e.profil === "Fonctionnel").length;
    const sansPC = employes.filter((e) => estActif(e) && !posteOf(e.id)).length;
    return { actifs, techniques, fonctionnels, sansPC };
  }, [employes, postes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employes
      .filter((e) => (filterStatut === "Tous" ? true : statutDe(e) === filterStatut))
      .filter((e) => {
        if (!q) return true;
        return [e.prenom, e.nom, e.matricule, e.profil, ...(e.modules || [])].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [employes, search, filterStatut]);

  return (
    <div>
      <HRDashboard employesActifs={employes.filter(estActif)} onOpenFiche={setFicheFor} />

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Salariés actifs" value={stats.actifs} accent="#1B2430" />
        <StatCard label="Techniques" value={stats.techniques} accent="#33587A" />
        <StatCard label="Fonctionnels" value={stats.fonctionnels} accent="#6B4C8A" />
        <StatCard label="Sans PC attribué" value={stats.sansPC} accent="#C67C2E" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "#8B96A3" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Rechercher (nom, profil, module…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select style={{ ...inputStyle, width: "auto", cursor: "pointer" }} value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="Tous">Tous les statuts</option>
          <option value="Actif">Actifs</option>
          <option value="Inactif">Inactifs</option>
        </select>
        <div style={{ flex: 1 }} />
        <PrimaryButton onClick={() => setShowForm(true)}>
          <Plus size={15} /> Nouveau salarié
        </PrimaryButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          text={employes.length === 0 ? "Aucun salarié enregistré. Ajoutez le premier." : "Aucun salarié ne correspond à cette recherche."}
        />
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #E1E5E9", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F6F7F8", textAlign: "left" }}>
                  {["Matricule", "Salarié", "Profil", "Depuis", "PC", "Véhicule", "Statut", ""].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 14px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#5C6B7A",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        borderBottom: "1px solid #E1E5E9",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const poste = posteOf(e.id);
                  const voiture = voitureOf(e.id);
                  const actif = estActif(e);
                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid #F0F2F4" }}>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#5C6B7A" }}>
                        {e.matricule}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => setFicheFor(e)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            textAlign: "left",
                          }}
                        >
                          <Avatar nom={nomComplet(e)} size={30} />
                          <span style={{ fontWeight: 600, color: "#1B2430" }}>{nomComplet(e)}</span>
                        </button>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge label={e.profil} styleMap={PROFIL_STYLES} />
                        {e.profil === "Fonctionnel" && e.modules?.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            {e.modules.map((m) => (
                              <Chip key={m}>{m}</Chip>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#5C6B7A", fontSize: 12.5 }}>
                        {formatDate(e.dateDebut)}
                        <div style={{ fontSize: 11, color: "#8B96A3" }}>{anciennete(e.dateDebut)}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {poste ? (
                          <div>
                            <div style={{ color: "#1B2430", fontSize: 12.5 }}>{poste.marque} {poste.modele}</div>
                            <div style={{ fontSize: 11, color: "#8B96A3", fontFamily: "var(--font-mono)" }}>{poste.numeroSerie}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#B7BFC7" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {voiture ? (
                          <div>
                            <div style={{ color: "#1B2430", fontSize: 12.5 }}>{voiture.marque} {voiture.modele}</div>
                            <div style={{ fontSize: 11, color: "#8B96A3", fontFamily: "var(--font-mono)" }}>{voiture.immatriculation}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#B7BFC7" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Pill label={statutDe(e)} styleMap={STATUT_EMPLOYE_STYLES} />
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {actif ? (
                            <SmallActionButton icon={<UserX size={15} />} label="Terminer le contrat" onClick={() => setConfirmDeactivate(e)} />
                          ) : (
                            <SmallActionButton icon={<UserCheck size={15} />} label="Réactiver" onClick={() => reactiverContrat(e.id)} />
                          )}
                          <SmallActionButton icon={<Eye size={15} />} label="Voir la fiche" onClick={() => setFicheFor(e)} />
                          <SmallActionButton icon={<Pencil size={15} />} label="Modifier" onClick={() => setEditing(e)} />
                          <SmallActionButton icon={<Trash2 size={15} />} label="Supprimer" tone="danger" onClick={() => setConfirmDelete(e)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ficheFor && (
        <FicheSalarieModal
          employe={ficheFor}
          poste={posteOf(ficheFor.id)}
          voiture={voitureOf(ficheFor.id)}
          postesDisponibles={postes.filter((p) => p.etat === "Disponible")}
          voituresDisponibles={voitures.filter((v) => v.etat === "Disponible")}
          modifications={historique.filter((h) => h.entite === "salarie" && h.entiteId === ficheFor.id)}
          assignPoste={assignPoste}
          returnPoste={returnPoste}
          assignVoiture={assignVoiture}
          returnVoiture={returnVoiture}
          onClose={() => setFicheFor(null)}
          onEdit={() => {
            setEditing(ficheFor);
            setFicheFor(null);
          }}
        />
      )}

      {(showForm || editing) && (
        <EmployeFormModal
          initial={editing}
          employes={employes}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(data, id) => {
            saveEmploye(data, id);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title="Terminer le contrat maintenant"
          message={`La date de fin de contrat de ${nomComplet(confirmDeactivate)} sera fixée à aujourd'hui et il/elle passera automatiquement en inactif. Son PC et son véhicule éventuellement attribués seront remis au statut « Disponible ».`}
          confirmLabel="Confirmer"
          onConfirm={() => {
            terminerContrat(confirmDeactivate.id);
            setConfirmDeactivate(null);
          }}
          onClose={() => setConfirmDeactivate(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce salarié"
          message={`Supprimer définitivement ${nomComplet(confirmDelete)} ? Ses équipements seront remis à disposition et son historique de salarié sera perdu.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deleteEmploye(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0" }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0F2F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C6B7A", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: "#8B96A3", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1B2430", fontWeight: 500 }}>{value || "—"}</div>
      </div>
    </div>
  );
}

function AssetSummaryCard({ icon, title, asset, subtitleFn, extraDates, emptyText, actionLabel, onAction, actionTone }) {
  return (
    <div style={{ border: "1px solid #E1E5E9", borderRadius: 10, padding: "12px 14px", flex: 1, minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, color: "#5C6B7A" }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
      </div>
      {asset ? (
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1B2430" }}>
            {asset.marque} {asset.modele}
          </div>
          <div style={{ fontSize: 11.5, color: "#8B96A3", fontFamily: "var(--font-mono)", marginTop: 2 }}>{subtitleFn(asset)}</div>
          {extraDates}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "#B7BFC7" }}>{emptyText}</div>
      )}
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            border: "1px solid #D7DCE1",
            background: "#FBFCFD",
            color: actionTone === "danger" ? "#A64B42" : "#33587A",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 10px",
            borderRadius: 7,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function FicheSalarieModal({
  employe,
  poste,
  voiture,
  postesDisponibles,
  voituresDisponibles,
  modifications,
  assignPoste,
  returnPoste,
  assignVoiture,
  returnVoiture,
  onClose,
  onEdit,
}) {
  const [showAssignPoste, setShowAssignPoste] = useState(false);
  const [showAssignVoiture, setShowAssignVoiture] = useState(false);
  const [confirmReturnPoste, setConfirmReturnPoste] = useState(false);
  const [confirmReturnVoiture, setConfirmReturnVoiture] = useState(false);
  const [showModifications, setShowModifications] = useState(false);

  const avatar = avatarStyle(nomComplet(employe));
  const age = calculerAge(employe.dateNaissance);
  const prochainAnniv = employe.dateNaissance ? prochaineOccurrence(employe.dateNaissance) : null;
  const joursAnniv = prochainAnniv ? joursAvant(prochainAnniv) : null;
  const prochainAnnivEntreprise = employe.dateDebut ? prochaineOccurrence(employe.dateDebut) : null;
  const joursAnnivEntreprise = prochainAnnivEntreprise ? joursAvant(prochainAnnivEntreprise) : null;
  const anneesEntreprise = prochainAnnivEntreprise
    ? prochainAnnivEntreprise.getFullYear() - new Date(employe.dateDebut + "T00:00:00").getFullYear()
    : null;

  const actif = estActif(employe);

  return (
    <Modal title="Fiche salarié" onClose={onClose} width={600}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "6px 6px 18px",
          borderBottom: "1px solid #EDEFF1",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: avatar.bg,
            color: avatar.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 21,
            fontFamily: "var(--font-display)",
            flexShrink: 0,
          }}
        >
          {initiales(nomComplet(employe))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1B2430", fontFamily: "var(--font-display)" }}>{nomComplet(employe)}</div>
          <div style={{ fontSize: 11.5, color: "#8B96A3", fontFamily: "var(--font-mono)", marginTop: 1 }}>Matricule {employe.matricule}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <Badge label={employe.profil} styleMap={PROFIL_STYLES} />
            <Pill label={statutDe(employe)} styleMap={STATUT_EMPLOYE_STYLES} />
          </div>
          {employe.profil === "Fonctionnel" && employe.modules?.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {employe.modules.map((m) => (
                <Chip key={m}>{m}</Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {(joursAnniv !== null && joursAnniv <= 30) || (joursAnnivEntreprise !== null && joursAnnivEntreprise <= 30 && anneesEntreprise > 0) ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "#FBF6EA",
            border: "1px solid #F2E4BE",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 16,
          }}
        >
          {joursAnniv !== null && joursAnniv <= 30 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#8A6A1F" }}>
              <Cake size={14} /> Anniversaire {libelleEcheance(joursAnniv)} ({formatDateCourt(prochainAnniv)}) — {age + (joursAnniv === 0 ? 0 : 1)} ans
            </div>
          )}
          {joursAnnivEntreprise !== null && joursAnnivEntreprise <= 30 && anneesEntreprise > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#8A6A1F" }}>
              <PartyPopper size={14} /> {anneesEntreprise} an{anneesEntreprise > 1 ? "s" : ""} chez Xpertiv {libelleEcheance(joursAnnivEntreprise)}
            </div>
          )}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginBottom: 6 }}>
        <InfoRow icon={<Cake size={13} />} label="Date de naissance" value={employe.dateNaissance ? `${formatDate(employe.dateNaissance)} (${age} ans)` : null} />
        <InfoRow icon={<UserRound size={13} />} label="Début de contrat" value={`${formatDate(employe.dateDebut)} · ${anciennete(employe.dateDebut)}`} />
        <InfoRow icon={<Mail size={13} />} label="Email pro" value={employe.emailPro} />
        <InfoRow icon={<Mail size={13} />} label="Email perso" value={employe.emailPerso} />
        <InfoRow icon={<Phone size={13} />} label="Téléphone" value={employe.telephone} />
        <InfoRow
          icon={<UserX size={13} />}
          label="Fin de contrat"
          value={employe.dateFinContrat ? `${formatDate(employe.dateFinContrat)}${actif ? " (à venir)" : ""}` : "CDI / non renseignée"}
        />
      </div>

      {(employe.contactUrgenceNom || employe.contactUrgenceTelephone) && (
        <div
          style={{
            border: "1px solid #E1E5E9",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F6E7E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#A64B42", flexShrink: 0 }}>
            <Phone size={13} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "#8B96A3", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Contact d'urgence{employe.contactUrgenceLien ? ` · ${employe.contactUrgenceLien}` : ""}
            </div>
            <div style={{ fontSize: 13, color: "#1B2430", fontWeight: 500 }}>
              {employe.contactUrgenceNom || "—"}
              {employe.contactUrgenceTelephone ? ` — ${employe.contactUrgenceTelephone}` : ""}
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", margin: "14px 0 8px" }}>
        Équipements attribués
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <AssetSummaryCard
          icon={<Monitor size={13} />}
          title="Poste"
          asset={poste}
          subtitleFn={(a) => a.numeroSerie}
          emptyText="Aucun poste attribué."
          extraDates={
            poste && (
              <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 5, lineHeight: 1.6 }}>
                <div>Achat : {formatDate(poste.dateAchat)}</div>
                <div>Attribution : {formatDate(poste.assignation.dateAttribution)}</div>
                {garantieEffective(poste).date && (
                  <div style={{ color: garantieEffective(poste).active ? "#1D6E64" : "#A64B42", fontWeight: 600 }}>
                    Garantie {garantieEffective(poste).active ? "jusqu'au" : "expirée le"} {formatDate(garantieEffective(poste).date)}
                  </div>
                )}
              </div>
            )
          }
          actionLabel={actif ? (poste ? "Retourner ce PC" : "Attribuer un PC") : null}
          actionTone={poste ? "danger" : "default"}
          onAction={() => (poste ? setConfirmReturnPoste(true) : setShowAssignPoste(true))}
        />
        <AssetSummaryCard
          icon={<Car size={13} />}
          title="Véhicule"
          asset={voiture}
          subtitleFn={(a) => a.immatriculation}
          emptyText="Aucun véhicule attribué."
          extraDates={
            voiture && (
              <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 5, lineHeight: 1.6 }}>
                <div>Contrat {voiture.typeContrat} : {formatDate(voiture.dateDebutContrat)} → {formatDate(voiture.dateFinContrat)}</div>
                {resumeFinancierVoiture(voiture) && <div>{resumeFinancierVoiture(voiture)}</div>}
                <div>Attribution : {formatDate(voiture.assignation.dateAttribution)}</div>
                <div style={{ marginTop: 5 }}>
                  <KmGauge kmReel={voiture.kmReel} kmContractuel={voiture.kmContractuel} width={180} />
                </div>
              </div>
            )
          }
          actionLabel={actif ? (voiture ? "Retourner ce véhicule" : "Attribuer un véhicule") : null}
          actionTone={voiture ? "danger" : "default"}
          onAction={() => (voiture ? setConfirmReturnVoiture(true) : setShowAssignVoiture(true))}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <GhostButton full onClick={() => setShowModifications(true)}>
          <ClipboardList size={14} /> Historique des modifications
        </GhostButton>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <GhostButton full onClick={onClose}>Fermer</GhostButton>
        <PrimaryButton full onClick={onEdit}>
          <Pencil size={14} /> Modifier la fiche
        </PrimaryButton>
      </div>

      {showModifications && (
        <ModificationsHistoryModal
          title={`Modifications — ${nomComplet(employe)}`}
          entries={modifications}
          onClose={() => setShowModifications(false)}
        />
      )}

      {showAssignPoste && (
        <AssignModal
          title={`Attribuer un PC — ${nomComplet(employe)}`}
          options={postesDisponibles}
          getLabel={(p) => `${p.marque} ${p.modele} — ${p.numeroSerie}`}
          emptyMessage="Aucun poste disponible actuellement dans le parc."
          onAssign={(posteId, date) => {
            assignPoste(posteId, employe.id, date);
            setShowAssignPoste(false);
          }}
          onClose={() => setShowAssignPoste(false)}
        />
      )}

      {showAssignVoiture && (
        <AssignModal
          title={`Attribuer un véhicule — ${nomComplet(employe)}`}
          options={voituresDisponibles}
          getLabel={(v) => `${v.marque} ${v.modele} — ${v.immatriculation}`}
          emptyMessage="Aucun véhicule disponible actuellement dans la flotte."
          onAssign={(voitureId, date) => {
            assignVoiture(voitureId, employe.id, date);
            setShowAssignVoiture(false);
          }}
          onClose={() => setShowAssignVoiture(false)}
        />
      )}

      {confirmReturnPoste && (
        <ConfirmModal
          title="Retourner le PC"
          message={`${nomComplet(employe)} rend ${poste.marque} ${poste.modele}. Le poste repassera au statut « Disponible » et la date de désattribution sera enregistrée.`}
          confirmLabel="Confirmer le retour"
          onConfirm={() => {
            returnPoste(poste.id);
            setConfirmReturnPoste(false);
          }}
          onClose={() => setConfirmReturnPoste(false)}
        />
      )}

      {confirmReturnVoiture && (
        <ConfirmModal
          title="Retourner le véhicule"
          message={`${nomComplet(employe)} rend ${voiture.marque} ${voiture.modele}. Le véhicule repassera au statut « Disponible » et la date de désattribution sera enregistrée.`}
          confirmLabel="Confirmer le retour"
          onConfirm={() => {
            returnVoiture(voiture.id);
            setConfirmReturnVoiture(false);
          }}
          onClose={() => setConfirmReturnVoiture(false)}
        />
      )}
    </Modal>
  );
}

function EmployeFormModal({ initial, employes, onClose, onSave }) {
  const [prenom, setPrenom] = useState(initial?.prenom || "");
  const [nom, setNom] = useState(initial?.nom || "");
  const [matricule, setMatricule] = useState(initial?.matricule || genererMatricule(employes));
  const [dateDebut, setDateDebut] = useState(initial?.dateDebut || todayISO());
  const [dateNaissance, setDateNaissance] = useState(initial?.dateNaissance || "");
  const [emailPro, setEmailPro] = useState(initial?.emailPro || "");
  const [emailPerso, setEmailPerso] = useState(initial?.emailPerso || "");
  const [telephone, setTelephone] = useState(initial?.telephone || "");
  const [dateFinContrat, setDateFinContrat] = useState(initial?.dateFinContrat || "");
  const [contactUrgenceNom, setContactUrgenceNom] = useState(initial?.contactUrgenceNom || "");
  const [contactUrgenceLien, setContactUrgenceLien] = useState(initial?.contactUrgenceLien || "");
  const [contactUrgenceTelephone, setContactUrgenceTelephone] = useState(initial?.contactUrgenceTelephone || "");
  const [profil, setProfil] = useState(initial?.profil || "Technique");
  const [modules, setModules] = useState(initial?.modules || []);
  const [error, setError] = useState("");

  const submit = () => {
    if (!prenom.trim() || !nom.trim()) {
      setError("Le prénom et le nom du salarié sont requis.");
      return;
    }
    if (!matriculeValide(matricule)) {
      setError("Le matricule doit contenir exactement 5 chiffres (ex. 00001).");
      return;
    }
    const doublon = employes.some((e) => e.matricule === matricule && e.id !== initial?.id);
    if (doublon) {
      setError("Ce matricule est déjà attribué à un autre salarié.");
      return;
    }
    onSave(
      {
        prenom: prenom.trim(),
        nom: nom.trim(),
        matricule,
        dateDebut,
        dateNaissance,
        emailPro: emailPro.trim(),
        emailPerso: emailPerso.trim(),
        telephone: telephone.trim(),
        dateFinContrat: dateFinContrat || null,
        contactUrgenceNom: contactUrgenceNom.trim(),
        contactUrgenceLien: contactUrgenceLien.trim(),
        contactUrgenceTelephone: contactUrgenceTelephone.trim(),
        profil,
        modules: profil === "Fonctionnel" ? modules : [],
      },
      initial?.id
    );
  };

  return (
    <Modal title={initial ? "Modifier le salarié" : "Nouveau salarié"} onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Prénom">
            <input style={inputStyle} value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Camille" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Nom">
            <input style={inputStyle} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Robert" />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Matricule" hint="5 chiffres">
            <input
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              value={matricule}
              maxLength={5}
              onChange={(e) => setMatricule(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="00001"
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Début de contrat">
            <input type="date" style={inputStyle} value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Date de naissance">
            <input type="date" style={inputStyle} value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Téléphone">
            <input style={inputStyle} value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Email professionnel">
            <input style={inputStyle} value={emailPro} onChange={(e) => setEmailPro(e.target.value)} placeholder="prenom.nom@xpertiv.fr" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Email personnel">
            <input style={inputStyle} value={emailPerso} onChange={(e) => setEmailPerso(e.target.value)} placeholder="prenom.nom@gmail.com" />
          </Field>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 8px" }}>
        Contact d'urgence
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="Nom">
            <input style={inputStyle} value={contactUrgenceNom} onChange={(e) => setContactUrgenceNom(e.target.value)} placeholder="Prénom Nom" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Lien">
            <input style={inputStyle} value={contactUrgenceLien} onChange={(e) => setContactUrgenceLien(e.target.value)} placeholder="Conjoint, parent…" />
          </Field>
        </div>
      </div>
      <Field label="Téléphone">
        <input
          style={inputStyle}
          value={contactUrgenceTelephone}
          onChange={(e) => setContactUrgenceTelephone(e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </Field>

      <Field
        label="Date de fin de contrat"
        hint="Laisser vide pour un CDI. Le salarié repasse automatiquement en « Inactif » dès que cette date est dépassée."
      >
        <input type="date" style={inputStyle} value={dateFinContrat} onChange={(e) => setDateFinContrat(e.target.value)} />
      </Field>
      <Field label="Profil de consultant">
        <div style={{ display: "flex", gap: 8 }}>
          {PROFILS.map((p) => (
            <button
              key={p}
              onClick={() => setProfil(p)}
              style={{
                flex: 1,
                padding: "9px 10px",
                borderRadius: 8,
                border: profil === p ? "1px solid #1B2430" : "1px solid #D7DCE1",
                background: profil === p ? "#1B2430" : "#FBFCFD",
                color: profil === p ? "#fff" : "#5C6B7A",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>
      {profil === "Fonctionnel" && (
        <Field label="Modules" hint="Liste ouverte — ajoutez les modules au fur et à mesure qu'ils sont définis.">
          <ModuleTagInput value={modules} onChange={setModules} />
        </Field>
      )}
      {error && <div style={{ color: "#A64B42", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full onClick={submit}>{initial ? "Enregistrer" : "Ajouter"}</PrimaryButton>
      </div>
    </Modal>
  );
}

/* ---------------------------------- Vue Postes (PC) ---------------------------------- */

function PostesView({ postes, employes, historique, savePoste, deletePoste, assignPoste, returnPoste, setPosteEtat }) {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [bitlockerFor, setBitlockerFor] = useState(null);

  const stats = useMemo(() => {
    return {
      total: postes.length,
      attribues: postes.filter((p) => p.etat === "Attribué").length,
      disponibles: postes.filter((p) => p.etat === "Disponible").length,
      retires: postes.filter((p) => p.etat === "Retiré").length,
    };
  }, [postes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postes
      .filter((p) => (filterEtat === "Tous" ? true : p.etat === filterEtat))
      .filter((p) => {
        if (!q) return true;
        const hay = [p.marque, p.modele, p.numeroSerie, p.nomPC, p.assignation?.employeNom].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.marque + a.modele).localeCompare(b.marque + b.modele));
  }, [postes, search, filterEtat]);

  const employesActifs = employes.filter(estActif);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Postes au total" value={stats.total} accent="#1B2430" />
        <StatCard label="Attribués" value={stats.attribues} accent="#33587A" />
        <StatCard label="Disponibles" value={stats.disponibles} accent="#1D6E64" />
        <StatCard label="Retirés" value={stats.retires} accent="#8A3A32" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "#8B96A3" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Rechercher (marque, modèle, série, salarié…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select style={{ ...inputStyle, width: "auto", cursor: "pointer" }} value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}>
          <option value="Tous">Tous les états</option>
          {ETATS_POSTE.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <PrimaryButton onClick={() => setShowForm(true)}>
          <Plus size={15} /> Nouveau poste
        </PrimaryButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Monitor size={22} />}
          text={postes.length === 0 ? "Aucun poste enregistré. Ajoutez le premier PC du parc." : "Aucun poste ne correspond à cette recherche."}
        />
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #E1E5E9", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F6F7F8", textAlign: "left" }}>
                  {["Poste", "Nom Windows", "N° de série", "Garantie", "État", "Attribué à", "Depuis", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E1E5E9", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const days = p.assignation ? daysSince(p.assignation.dateAttribution) : null;
                  const garantie = garantieEffective(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F0F2F4" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1B2430" }}>{p.marque} {p.modele}</div>
                        <div style={{ fontSize: 11.5, color: "#8B96A3" }}>Acquis le {formatDate(p.dateAchat)}</div>
                        {p.etat === "Retiré" && p.dateRetrait && (
                          <div style={{ fontSize: 11.5, color: "#8A3A32" }}>Retiré le {formatDate(p.dateRetrait)}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#1B2430" }}>
                        {p.nomPC || <span style={{ color: "#B7BFC7" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#3A4453" }}>
                        {p.numeroSerie}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {garantie.date ? (
                          <div>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: garantie.active ? "#1D6E64" : "#A64B42",
                              }}
                            >
                              {garantie.active ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                              {garantie.active ? "Sous garantie" : "Expirée"}
                            </div>
                            <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 2 }}>
                              jusqu'au {formatDate(garantie.date)}
                              {p.garantieEtendue && p.dateFinGarantieEtendue === garantie.date ? " (étendue)" : ""}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#B7BFC7" }}>Non renseignée</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Pill label={p.etat} styleMap={POSTE_ETAT_STYLES} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {p.assignation ? (
                          <div style={{ color: "#1B2430", fontWeight: 500 }}>{p.assignation.employeNom}</div>
                        ) : (
                          <span style={{ color: "#B7BFC7" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#5C6B7A", fontSize: 12.5 }}>
                        {p.assignation ? (
                          <>
                            {formatDate(p.assignation.dateAttribution)}
                            <div style={{ fontSize: 11, color: "#8B96A3" }}>{days} j</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {p.etat !== "Attribué" && p.etat !== "Retiré" && (
                            <SmallActionButton icon={<UserPlus size={15} />} label="Attribuer" onClick={() => setAssigning(p)} />
                          )}
                          {p.etat !== "Retiré" && (
                            <SmallActionButton icon={<Archive size={15} />} label="Retirer du parc" onClick={() => setPosteEtat(p.id, "Retiré")} />
                          )}
                          {p.etat === "Retiré" && (
                            <SmallActionButton icon={<RotateCcw size={15} />} label="Remettre dans le parc" onClick={() => setPosteEtat(p.id, "Disponible")} />
                          )}
                          <SmallActionButton icon={<KeyRound size={15} />} label="Clé BitLocker" onClick={() => setBitlockerFor(p)} />
                          <SmallActionButton icon={<History size={15} />} label="Historique" onClick={() => setHistoryFor(p)} />
                          <SmallActionButton icon={<Pencil size={15} />} label="Modifier" onClick={() => setEditing(p)} />
                          <SmallActionButton icon={<Trash2 size={15} />} label="Supprimer" tone="danger" onClick={() => setConfirmDelete(p)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showForm || editing) && (
        <PosteFormModal
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(data, id) => {
            savePoste(data, id);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {assigning && (
        <AssignModal
          title={`Attribuer — ${assigning.marque} ${assigning.modele}`}
          options={employesActifs}
          getLabel={(e) => `${nomComplet(e)} — ${e.profil}`}
          emptyMessage="Aucun salarié actif à qui attribuer ce poste."
          onAssign={(employeId, date) => {
            assignPoste(assigning.id, employeId, date);
            setAssigning(null);
          }}
          onClose={() => setAssigning(null)}
        />
      )}

      {historyFor && (
        <HistoriqueCombineModal
          title={`Historique — ${historyFor.marque} ${historyFor.modele}`}
          subtitle={`${historyFor.numeroSerie}${historyFor.nomPC ? " · " + historyFor.nomPC : ""}`}
          current={historyFor.assignation}
          historiqueAttribution={historyFor.historique}
          modifications={historique.filter((h) => h.entite === "poste" && h.entiteId === historyFor.id)}
          onClose={() => setHistoryFor(null)}
        />
      )}

      {bitlockerFor && <BitlockerModal poste={bitlockerFor} onClose={() => setBitlockerFor(null)} />}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce poste"
          message={`Supprimer définitivement ${confirmDelete.marque} ${confirmDelete.modele} (${confirmDelete.numeroSerie}) ? Son historique d'attribution sera perdu.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deletePoste(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function BitlockerModal({ poste, onClose }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasKey = !!poste.bitlockerCle;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(poste.bitlockerCle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setVisible(true);
    }
  };

  return (
    <Modal title={`Clé BitLocker — ${poste.marque} ${poste.modele}`} onClose={onClose} width={440}>
      <div style={{ fontSize: 11.5, color: "#8B96A3", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        {poste.numeroSerie}
        {poste.nomPC ? ` · ${poste.nomPC}` : ""}
      </div>

      {hasKey ? (
        <>
          <div
            style={{
              border: "1px solid #E1E5E9",
              borderRadius: 10,
              padding: "12px 14px",
              background: "#FBFCFD",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "#1B2430",
              letterSpacing: "0.02em",
              wordBreak: "break-all",
              marginBottom: 12,
            }}
          >
            {visible ? poste.bitlockerCle : "••••••-••••••-••••••-••••••-••••••-••••••-••••••-••••••"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostButton full onClick={() => setVisible((v) => !v)}>
              {visible ? "Masquer" : "Afficher"}
            </GhostButton>
            <PrimaryButton full onClick={copier}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copié" : "Copier"}
            </PrimaryButton>
          </div>
          <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 12 }}>
            Cette clé permet de déverrouiller le disque en cas d'oubli du mot de passe ou de récupération. Ne la
            partage que par un canal sécurisé.
          </div>
        </>
      ) : (
        <EmptyState icon={<KeyRound size={20} />} text="Aucune clé BitLocker enregistrée pour ce poste." />
      )}

      <div style={{ marginTop: 16 }}>
        <GhostButton full onClick={onClose}>Fermer</GhostButton>
      </div>
    </Modal>
  );
}

function PosteFormModal({ initial, onClose, onSave }) {
  const [marque, setMarque] = useState(initial?.marque || "");
  const [modele, setModele] = useState(initial?.modele || "");
  const [numeroSerie, setNumeroSerie] = useState(initial?.numeroSerie || "");
  const [nomPC, setNomPC] = useState(initial?.nomPC || "");
  const [dateAchat, setDateAchat] = useState(initial?.dateAchat || todayISO());
  const [dateFinGarantie, setDateFinGarantie] = useState(initial?.dateFinGarantie || "");
  const [garantieEtendue, setGarantieEtendue] = useState(initial?.garantieEtendue || false);
  const [dateFinGarantieEtendue, setDateFinGarantieEtendue] = useState(initial?.dateFinGarantieEtendue || "");
  const [bitlockerCle, setBitlockerCle] = useState(initial?.bitlockerCle || "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!marque.trim() || !modele.trim() || !numeroSerie.trim()) {
      setError("Marque, modèle et numéro de série sont requis.");
      return;
    }
    onSave(
      {
        marque: marque.trim(),
        modele: modele.trim(),
        numeroSerie: numeroSerie.trim(),
        nomPC: nomPC.trim(),
        dateAchat,
        dateFinGarantie: dateFinGarantie || null,
        garantieEtendue,
        dateFinGarantieEtendue: garantieEtendue ? dateFinGarantieEtendue || null : null,
        bitlockerCle: bitlockerCle.trim(),
      },
      initial?.id
    );
  };

  return (
    <Modal title={initial ? "Modifier le poste" : "Nouveau poste"} onClose={onClose}>
      <Field label="Marque">
        <input style={inputStyle} value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Dell, Apple, Lenovo…" />
      </Field>
      <Field label="Modèle">
        <input style={inputStyle} value={modele} onChange={(e) => setModele(e.target.value)} placeholder="Latitude 7440" />
      </Field>
      <Field label="Numéro de série">
        <input style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} placeholder="DL7440-2201" />
      </Field>
      <Field
        label="Nom du PC (Windows)"
        hint="Visible via Paramètres → Système → À propos, ou hostname dans l'invite de commandes."
      >
        <input style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} value={nomPC} onChange={(e) => setNomPC(e.target.value)} placeholder="ex. CPTA-PC-014" />
      </Field>
      <Field label="Date d'achat">
        <input type="date" style={inputStyle} value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
      </Field>
      <Field label="Fin de garantie constructeur">
        <input type="date" style={inputStyle} value={dateFinGarantie} onChange={(e) => setDateFinGarantie(e.target.value)} />
      </Field>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: garantieEtendue ? 10 : 13,
          cursor: "pointer",
        }}
        onClick={() => setGarantieEtendue((v) => !v)}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: garantieEtendue ? "1px solid #1B2430" : "1px solid #D7DCE1",
            background: garantieEtendue ? "#1B2430" : "#FBFCFD",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {garantieEtendue && <Check size={12} color="#fff" />}
        </div>
        <span style={{ fontSize: 13, color: "#1B2430", fontWeight: 500 }}>Garantie étendue achetée à l'achat</span>
      </div>

      {garantieEtendue && (
        <Field label="Fin de garantie étendue" hint="Remplace la garantie constructeur pour déterminer si le poste est encore couvert.">
          <input type="date" style={inputStyle} value={dateFinGarantieEtendue} onChange={(e) => setDateFinGarantieEtendue(e.target.value)} />
        </Field>
      )}

      <Field
        label="Clé de récupération BitLocker"
        hint="Permet de déverrouiller le disque en cas d'oubli du mot de passe. Laisser vide si le chiffrement n'est pas activé."
      >
        <textarea
          style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12.5, resize: "vertical", minHeight: 56 }}
          value={bitlockerCle}
          onChange={(e) => setBitlockerCle(e.target.value)}
          placeholder="482910-663215-091847-720536-…"
        />
      </Field>

      {error && <div style={{ color: "#A64B42", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full onClick={submit}>{initial ? "Enregistrer" : "Ajouter"}</PrimaryButton>
      </div>
    </Modal>
  );
}

/* ---------------------------------- Vue Véhicules ---------------------------------- */

function VoituresView({ voitures, employes, historique, saveVoiture, deleteVoiture, assignVoiture, returnVoiture, setVoitureEtat }) {
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [updatingKm, setUpdatingKm] = useState(null);

  const stats = useMemo(() => {
    return {
      total: voitures.length,
      attribuees: voitures.filter((v) => v.etat === "Attribuée").length,
      disponibles: voitures.filter((v) => v.etat === "Disponible").length,
      retirees: voitures.filter((v) => v.etat === "Retirée").length,
    };
  }, [voitures]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voitures
      .filter((v) => (filterEtat === "Tous" ? true : v.etat === filterEtat))
      .filter((v) => {
        if (!q) return true;
        const hay = [v.marque, v.modele, v.immatriculation, v.assignation?.employeNom].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.marque + a.modele).localeCompare(b.marque + b.modele));
  }, [voitures, search, filterEtat]);

  const employesActifs = employes.filter(estActif);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Véhicules au total" value={stats.total} accent="#1B2430" />
        <StatCard label="Attribuées" value={stats.attribuees} accent="#33587A" />
        <StatCard label="Disponibles" value={stats.disponibles} accent="#1D6E64" />
        <StatCard label="Retirées" value={stats.retirees} accent="#8A3A32" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "#8B96A3" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Rechercher (marque, modèle, immatriculation, salarié…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select style={{ ...inputStyle, width: "auto", cursor: "pointer" }} value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}>
          <option value="Tous">Tous les états</option>
          {ETATS_VOITURE.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <PrimaryButton onClick={() => setShowForm(true)}>
          <Plus size={15} /> Nouveau véhicule
        </PrimaryButton>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Car size={22} />}
          text={voitures.length === 0 ? "Aucun véhicule enregistré. Ajoutez le premier de la flotte." : "Aucun véhicule ne correspond à cette recherche."}
        />
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #E1E5E9", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F6F7F8", textAlign: "left" }}>
                  {["Véhicule", "Immatriculation", "Contrat", "Kilométrage", "État", "Attribué à", "Depuis", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#5C6B7A", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E1E5E9", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const days = v.assignation ? daysSince(v.assignation.dateAttribution) : null;
                  return (
                    <tr key={v.id} style={{ borderBottom: "1px solid #F0F2F4" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1B2430" }}>{v.marque} {v.modele}</div>
                        <div style={{ fontSize: 11.5, color: "#8B96A3" }}>Début le {formatDate(v.dateDebutContrat)}</div>
                        {v.etat === "Retirée" && v.dateRetrait && (
                          <div style={{ fontSize: 11.5, color: "#8A3A32" }}>Retirée le {formatDate(v.dateRetrait)}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#3A4453" }}>
                        {v.immatriculation}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {v.typeContrat && <Badge label={v.typeContrat} styleMap={CONTRAT_TYPE_STYLES} />}
                        <div style={{ fontSize: 11, color: "#8B96A3", marginTop: 4 }}>
                          {formatDate(v.dateDebutContrat)} → {formatDate(v.dateFinContrat)}
                        </div>
                        {resumeFinancierVoiture(v) && (
                          <div style={{ fontSize: 11, color: "#5C6B7A", marginTop: 2, fontWeight: 600 }}>{resumeFinancierVoiture(v)}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <KmGauge kmReel={v.kmReel} kmContractuel={v.kmContractuel} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Pill label={v.etat} styleMap={VOITURE_ETAT_STYLES} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {v.assignation ? (
                          <div style={{ color: "#1B2430", fontWeight: 500 }}>{v.assignation.employeNom}</div>
                        ) : (
                          <span style={{ color: "#B7BFC7" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#5C6B7A", fontSize: 12.5 }}>
                        {v.assignation ? (
                          <>
                            {formatDate(v.assignation.dateAttribution)}
                            <div style={{ fontSize: 11, color: "#8B96A3" }}>{days} j</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {v.etat !== "Attribuée" && v.etat !== "Retirée" && (
                            <SmallActionButton icon={<UserPlus size={15} />} label="Attribuer" onClick={() => setAssigning(v)} />
                          )}
                          {v.etat !== "Retirée" && (
                            <SmallActionButton icon={<Archive size={15} />} label="Retirer de la flotte" onClick={() => setVoitureEtat(v.id, "Retirée")} />
                          )}
                          {v.etat === "Retirée" && (
                            <SmallActionButton icon={<RotateCcw size={15} />} label="Remettre en circulation" onClick={() => setVoitureEtat(v.id, "Disponible")} />
                          )}
                          <SmallActionButton icon={<Gauge size={15} />} label="Mettre à jour le kilométrage" onClick={() => setUpdatingKm(v)} />
                          <SmallActionButton icon={<History size={15} />} label="Historique" onClick={() => setHistoryFor(v)} />
                          <SmallActionButton icon={<Pencil size={15} />} label="Modifier" onClick={() => setEditing(v)} />
                          <SmallActionButton icon={<Trash2 size={15} />} label="Supprimer" tone="danger" onClick={() => setConfirmDelete(v)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showForm || editing) && (
        <VoitureFormModal
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(data, id) => {
            saveVoiture(data, id);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {assigning && (
        <AssignModal
          title={`Attribuer — ${assigning.marque} ${assigning.modele}`}
          options={employesActifs}
          getLabel={(e) => `${nomComplet(e)} — ${e.profil}`}
          emptyMessage="Aucun salarié actif à qui attribuer ce véhicule."
          onAssign={(employeId, date) => {
            assignVoiture(assigning.id, employeId, date);
            setAssigning(null);
          }}
          onClose={() => setAssigning(null)}
        />
      )}

      {historyFor && (
        <HistoriqueCombineModal
          title={`Historique — ${historyFor.marque} ${historyFor.modele}`}
          subtitle={historyFor.immatriculation}
          current={historyFor.assignation}
          historiqueAttribution={historyFor.historique}
          modifications={historique.filter((h) => h.entite === "voiture" && h.entiteId === historyFor.id)}
          onClose={() => setHistoryFor(null)}
        />
      )}

      {updatingKm && (
        <UpdateKmModal
          voiture={updatingKm}
          onClose={() => setUpdatingKm(null)}
          onSave={(kmReel) => {
            saveVoiture({ kmReel }, updatingKm.id);
            setUpdatingKm(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce véhicule"
          message={`Supprimer définitivement ${confirmDelete.marque} ${confirmDelete.modele} (${confirmDelete.immatriculation}) ? Son historique d'attribution sera perdu.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deleteVoiture(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function VoitureFormModal({ initial, onClose, onSave }) {
  const [marque, setMarque] = useState(initial?.marque || "");
  const [modele, setModele] = useState(initial?.modele || "");
  const [immatriculation, setImmatriculation] = useState(initial?.immatriculation || "");
  const [typeContrat, setTypeContrat] = useState(initial?.typeContrat || "LLD");
  const [dateDebutContrat, setDateDebutContrat] = useState(initial?.dateDebutContrat || todayISO());
  const [dateFinContrat, setDateFinContrat] = useState(initial?.dateFinContrat || "");
  const [loyerMensuel, setLoyerMensuel] = useState(initial?.loyerMensuel ?? "");
  const [optionAchat, setOptionAchat] = useState(initial?.optionAchat ?? "");
  const [prixAchat, setPrixAchat] = useState(initial?.prixAchat ?? "");
  const [kmContractuel, setKmContractuel] = useState(initial?.kmContractuel ?? "");
  const [kmReel, setKmReel] = useState(initial?.kmReel ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!marque.trim() || !modele.trim() || !immatriculation.trim()) {
      setError("Marque, modèle et immatriculation sont requis.");
      return;
    }
    onSave(
      {
        marque: marque.trim(),
        modele: modele.trim(),
        immatriculation: immatriculation.trim().toUpperCase(),
        typeContrat,
        dateDebutContrat,
        dateFinContrat: dateFinContrat || null,
        loyerMensuel: typeContrat === "LLD" || typeContrat === "LOA" ? Number(loyerMensuel) || 0 : null,
        optionAchat: typeContrat === "LOA" ? Number(optionAchat) || 0 : null,
        prixAchat: typeContrat === "Achat" ? Number(prixAchat) || 0 : null,
        kmContractuel: kmContractuel === "" ? 0 : Number(kmContractuel),
        kmReel: kmReel === "" ? 0 : Number(kmReel),
      },
      initial?.id
    );
  };

  return (
    <Modal title={initial ? "Modifier le véhicule" : "Nouveau véhicule"} onClose={onClose}>
      <Field label="Marque">
        <input style={inputStyle} value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Peugeot, Renault…" />
      </Field>
      <Field label="Modèle">
        <input style={inputStyle} value={modele} onChange={(e) => setModele(e.target.value)} placeholder="308, Clio…" />
      </Field>
      <Field label="Immatriculation">
        <input style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} placeholder="AB-123-CD" />
      </Field>
      <Field label="Type de contrat">
        <div style={{ display: "flex", gap: 6 }}>
          {TYPES_CONTRAT_VOITURE.map((t) => (
            <button
              key={t}
              onClick={() => setTypeContrat(t)}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: 8,
                border: typeContrat === t ? "1px solid #1B2430" : "1px solid #D7DCE1",
                background: typeContrat === t ? "#1B2430" : "#FBFCFD",
                color: typeContrat === t ? "#fff" : "#5C6B7A",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Début de contrat">
            <input type="date" style={inputStyle} value={dateDebutContrat} onChange={(e) => setDateDebutContrat(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Fin de contrat">
            <input type="date" style={inputStyle} value={dateFinContrat} onChange={(e) => setDateFinContrat(e.target.value)} />
          </Field>
        </div>
      </div>

      {(typeContrat === "LLD" || typeContrat === "LOA") && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Loyer mensuel">
              <input
                type="number"
                min="0"
                style={inputStyle}
                value={loyerMensuel}
                onChange={(e) => setLoyerMensuel(e.target.value)}
                placeholder="420"
              />
            </Field>
          </div>
          {typeContrat === "LOA" && (
            <div style={{ flex: 1 }}>
              <Field label="Option d'achat" hint="Montant en fin de contrat">
                <input
                  type="number"
                  min="0"
                  style={inputStyle}
                  value={optionAchat}
                  onChange={(e) => setOptionAchat(e.target.value)}
                  placeholder="6500"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {typeContrat === "Achat" && (
        <Field label="Prix d'achat">
          <input
            type="number"
            min="0"
            style={inputStyle}
            value={prixAchat}
            onChange={(e) => setPrixAchat(e.target.value)}
            placeholder="24900"
          />
        </Field>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Kilométrage contractuel" hint="Plafond prévu au contrat">
            <input
              type="number"
              min="0"
              style={inputStyle}
              value={kmContractuel}
              onChange={(e) => setKmContractuel(e.target.value)}
              placeholder="60000"
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Kilométrage réel" hint="Relevé actuel">
            <input
              type="number"
              min="0"
              style={inputStyle}
              value={kmReel}
              onChange={(e) => setKmReel(e.target.value)}
              placeholder="38500"
            />
          </Field>
        </div>
      </div>
      {(kmContractuel !== "" || kmReel !== "") && (
        <div style={{ marginBottom: 13 }}>
          <KmGauge kmReel={Number(kmReel) || 0} kmContractuel={Number(kmContractuel) || 0} width={220} />
        </div>
      )}
      {error && <div style={{ color: "#A64B42", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full onClick={submit}>{initial ? "Enregistrer" : "Ajouter"}</PrimaryButton>
      </div>
    </Modal>
  );
}

function UpdateKmModal({ voiture, onClose, onSave }) {
  const [kmReel, setKmReel] = useState(voiture.kmReel ?? 0);
  const [error, setError] = useState("");

  const submit = () => {
    if (kmReel === "" || Number(kmReel) < 0) {
      setError("Indiquez un kilométrage valide.");
      return;
    }
    onSave(Number(kmReel));
  };

  return (
    <Modal title={`Kilométrage — ${voiture.marque} ${voiture.modele}`} onClose={onClose} width={380}>
      <Field label="Kilométrage réel actuel">
        <input
          type="number"
          min="0"
          style={inputStyle}
          value={kmReel}
          onChange={(e) => setKmReel(e.target.value)}
          autoFocus
        />
      </Field>
      <div style={{ marginBottom: 13 }}>
        <KmGauge kmReel={Number(kmReel) || 0} kmContractuel={voiture.kmContractuel} width={220} />
      </div>
      {error && <div style={{ color: "#A64B42", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <GhostButton full onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton full onClick={submit}>Enregistrer</PrimaryButton>
      </div>
    </Modal>
  );
}
