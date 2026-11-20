import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AppSettings } from "../types/game";
import { playFeedback } from "../utils/feedback";

const SETTINGS_STORAGE_KEY = "dathoineee_app_settings_v1";
const PROFILE_PREF_KEY = "dathoineee_player_pref_v1";

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  effectsEnabled: true,
  vibrationEnabled: true,
  theme: "light",
  language: "vi",
};

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface PlayerPref {
  nickname: string;
  avatar: string;
}

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  playerPref: PlayerPref;
  savePlayerPref: (nickname: string, avatar: string) => void;
  feedback: (type: "tap" | "success" | "alert" | "bell") => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage["type"]) => void;
  dismissToast: (id: string) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function readStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      soundEnabled: parsed.soundEnabled ?? true,
      effectsEnabled: parsed.effectsEnabled ?? true,
      vibrationEnabled: parsed.vibrationEnabled ?? true,
      theme: parsed.theme === "dark" ? "dark" : "light",
      language: "vi",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readStoredPlayerPref(): PlayerPref {
  try {
    const raw = localStorage.getItem(PROFILE_PREF_KEY);
    if (!raw) return { nickname: "", avatar: "avatar-dino" };
    const parsed = JSON.parse(raw) as Partial<PlayerPref>;
    return {
      nickname: typeof parsed.nickname === "string" ? parsed.nickname : "",
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : "avatar-dino",
    };
  } catch {
    return { nickname: "", avatar: "avatar-dino" };
  }
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(readStoredSettings);
  const [playerPref, setPlayerPref] = useState<PlayerPref>(readStoredPlayerPref);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute(
      "data-effects",
      settings.effectsEnabled ? "on" : "off"
    );
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota issues
    }
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const savePlayerPref = useCallback((nickname: string, avatar: string) => {
    const next = { nickname: nickname.trim(), avatar };
    setPlayerPref(next);
    try {
      localStorage.setItem(PROFILE_PREF_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota issues
    }
  }, []);

  const feedback = useCallback(
    (type: "tap" | "success" | "alert" | "bell") => {
      playFeedback(type, settings);
    },
    [settings]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        updateSetting,
        playerPref,
        savePlayerPref,
        feedback,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return ctx;
}
