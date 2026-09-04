import { supabase } from "./supabaseClient.js";

/**
 * Adaptateur de stockage.
 *
 * - Dans Claude (artifact) : utilise window.storage (fourni par Claude).
 * - En dehors (déploiement réel) : utilise la table `kv_store` de Supabase,
 *   partagée entre tous les comptes approuvés (voir supabase/schema.sql).
 *
 * L'API reste identique (get/set/delete/list) : le reste de l'app
 * (App.jsx) n'a jamais besoin de savoir quel backend est utilisé.
 */

const hasClaudeStorage = typeof window !== "undefined" && !!window.storage;

async function supaGet(key) {
  const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("not found");
  return { key, value: JSON.stringify(data.value), shared: true };
}

async function supaSet(key, value) {
  const parsed = JSON.parse(value);
  const { error } = await supabase
    .from("kv_store")
    .upsert({ key, value: parsed, updated_at: new Date().toISOString() });
  if (error) throw error;
  return { key, value, shared: true };
}

async function supaDelete(key) {
  const { error } = await supabase.from("kv_store").delete().eq("key", key);
  if (error) throw error;
  return { key, deleted: true, shared: true };
}

async function supaList(prefix = "") {
  const { data, error } = await supabase.from("kv_store").select("key").like("key", `${prefix}%`);
  if (error) throw error;
  return { keys: (data || []).map((r) => r.key), prefix, shared: true };
}

export const storage = hasClaudeStorage
  ? window.storage
  : {
      get: (key) => supaGet(key),
      set: (key, value) => supaSet(key, value),
      delete: (key) => supaDelete(key),
      list: (prefix) => supaList(prefix),
    };
