import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AppSettings, AvatarConfig, PerformanceQuality } from "../types/game";
import { ensureTabVisibilityPauseHook } from "../animation/animationEngine";
import { DEFAULT_AVATAR_CONFIG } from "../utils/avatars";
import { fetchProfileAvatarConfig } from "../services/avatarAssetService";
import { playFeedback } from "../utils/feedback";

const SETTINGS_STORAGE_KEY = "dathoineee_app_settings_v1";
const PROFILE_PREF_KEY = "dathoineee_player_pref_v1";

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  effectsEnabled: true,
  vibrationEnabled: true,
  performanceQuality: "medium",
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
  avatarConfig: AvatarConfig;
}

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  playerPref: PlayerPref;
  savePlayerPref: (nickname: string, avatar: string, avatarConfig?: AvatarConfig) => void;
  saveAvatarConfigPref: (avatarConfig: AvatarConfig) => void;
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
    const perf: PerformanceQuality =
      parsed.performanceQuality === "low" ||
      parsed.performanceQuality === "high" ||
      parsed.performanceQuality === "medium"
        ? parsed.performanceQuality
        : "medium";
    return {
      soundEnabled: parsed.soundEnabled ?? true,
      effectsEnabled: parsed.effectsEnabled ?? true,
      vibrationEnabled: parsed.vibrationEnabled ?? true,
      performanceQuality: perf,
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
    if (!raw) {
      return {
        nickname: "",
        avatar: DEFAULT_AVATAR_CONFIG.avatarId,
        avatarConfig: DEFAULT_AVATAR_CONFIG,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerPref>;
    const avatar =
      typeof parsed.avatar === "string" && parsed.avatar
        ? parsed.avatar
        : DEFAULT_AVATAR_CONFIG.avatarId;
    const rawCfg = parsed.avatarConfig;
    const avatarConfig: AvatarConfig =
      rawCfg && typeof rawCfg === "object" && typeof rawCfg.avatarId === "string"
        ? {
            avatarId: rawCfg.avatarId || avatar,
            headId: rawCfg.headId ?? null,
            wingsId: rawCfg.wingsId ?? null,
            effectsId: rawCfg.effectsId ?? null,
            otherIds: Array.isArray(rawCfg.otherIds) ? rawCfg.otherIds : [],
          }
        : { ...DEFAULT_AVATAR_CONFIG, avatarId: avatar };
    return {
      nickname: typeof parsed.nickname === "string" ? parsed.nickname : "",
      avatar: avatarConfig.avatarId,
      avatarConfig,
    };
  } catch {
    return {
      nickname: "",
      avatar: DEFAULT_AVATAR_CONFIG.avatarId,
      avatarConfig: DEFAULT_AVATAR_CONFIG,
    };
  }
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(readStoredSettings);
  const [playerPref, setPlayerPref] = useState<PlayerPref>(readStoredPlayerPref);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    ensureTabVisibilityPauseHook();
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute(
      "data-effects",
      settings.effectsEnabled ? "on" : "off"
    );
    document.documentElement.setAttribute(
      "data-quality",
      settings.performanceQuality ?? "medium"
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

  const savePlayerPref = useCallback(
    (nickname: string, avatar: string, avatarConfig?: AvatarConfig) => {
      setPlayerPref((prev) => {
        const resolvedConfig: AvatarConfig = avatarConfig
          ? { ...avatarConfig }
          : { ...prev.avatarConfig, avatarId: avatar };
        const next: PlayerPref = {
          nickname: nickname.trim(),
          avatar: resolvedConfig.avatarId,
          avatarConfig: resolvedConfig,
        };
        try {
          localStorage.setItem(PROFILE_PREF_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota issues
        }
        return next;
      });
    },
    []
  );

  const saveAvatarConfigPref = useCallback((avatarConfig: AvatarConfig) => {
    setPlayerPref((prev) => {
      const next: PlayerPref = {
        ...prev,
        avatar: avatarConfig.avatarId,
        avatarConfig,
      };
      try {
        localStorage.setItem(PROFILE_PREF_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota issues
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    fetchProfileAvatarConfig()
      .then((remoteConfig) => {
        if (!active || !remoteConfig) return;
        setPlayerPref((prev) => {
          const next: PlayerPref = {
            ...prev,
            avatar: remoteConfig.avatarId,
            avatarConfig: remoteConfig,
          };
          try {
            localStorage.setItem(PROFILE_PREF_KEY, JSON.stringify(next));
          } catch {
            // Ignore
          }
          return next;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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
        saveAvatarConfigPref,
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

export function useOptionalPerformanceQuality(): PerformanceQuality {
  const ctx = useContext(AppSettingsContext);
  return ctx?.settings.performanceQuality ?? "medium";
}
