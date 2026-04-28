// src/sim/leaderboardStore.js

const STORAGE_KEY = "scs_leaderboard_entries";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return fallback;
  }
}

export function loadLeaderboardEntries() {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const parsed = safeParse(raw, []);
  if (!Array.isArray(parsed)) return [];

  return parsed;
}

export function writeLeaderboardEntries(entries) {
  if (!isBrowser()) return;

  const safeEntries = Array.isArray(entries) ? entries : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeEntries));
}

export function saveLeaderboardEntry(entry) {
  const current = loadLeaderboardEntries();

  const next = [entry, ...current];
  writeLeaderboardEntries(next);

  return next;
}

export function deleteLeaderboardEntry(entryId) {
  const current = loadLeaderboardEntries();
  const next = current.filter((entry) => entry.id !== entryId);

  writeLeaderboardEntries(next);
  return next;
}

export function clearLeaderboardEntries() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}