import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AvatarAsset } from "../types/game";
import { FALLBACK_AVATAR_ASSETS } from "../utils/avatars";
import { fetchPublicAvatarAssets } from "../services/avatarAssetService";
import { isSupabaseConfigured, supabase } from "../services/supabase";

interface AvatarCatalogContextValue {
  assets: AvatarAsset[];
  loading: boolean;
  refreshCatalog: () => Promise<void>;
  getAssetById: (id: string | null | undefined) => AvatarAsset | undefined;
}

const AvatarCatalogContext = createContext<AvatarCatalogContextValue | null>(null);

export const AvatarCatalogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [assets, setAssets] = useState<AvatarAsset[]>(FALLBACK_AVATAR_ASSETS);
  const [loading, setLoading] = useState(true);

  const refreshCatalog = useCallback(async () => {
    try {
      const list = await fetchPublicAvatarAssets();
      setAssets(list);
    } catch {
      setAssets(FALLBACK_AVATAR_ASSETS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const topic = `public-avatar-assets-sync-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avatar_assets" },
        () => {
          refreshCatalog();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [refreshCatalog]);

  const byId = useMemo(
    () => new Map(assets.map((item) => [item.id, item])),
    [assets]
  );

  const getAssetById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return undefined;
      return byId.get(id);
    },
    [byId]
  );

  return (
    <AvatarCatalogContext.Provider
      value={{
        assets,
        loading,
        refreshCatalog,
        getAssetById,
      }}
    >
      {children}
    </AvatarCatalogContext.Provider>
  );
};

export function useAvatarCatalog(): AvatarCatalogContextValue {
  const ctx = useContext(AvatarCatalogContext);
  if (!ctx) {
    throw new Error("useAvatarCatalog must be used inside AvatarCatalogProvider");
  }
  return ctx;
}
