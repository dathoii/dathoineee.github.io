import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  LogOut,
  Move,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { AdminCombinationModal } from "../../components/admin/AdminCombinationModal";
import { AssetAnimationModal } from "../../components/admin/AssetAnimationModal";
import { AssetPositionModal } from "../../components/admin/AssetPositionModal";
import { AssetUploadModal } from "../../components/admin/AssetUploadModal";
import {
  ASSET_CATEGORIES_META,
  CATEGORY_PRESET_MAP,
} from "../../components/admin/assetManagerPresets";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAvatarCatalog } from "../../contexts/AvatarCatalogContext";
import { adminSignOut } from "../../services/adminService";
import {
  adminDeleteAvatarAsset,
  adminListAvatarAssets,
  adminUpdateAvatarAsset,
} from "../../services/avatarAssetService";
import type { AssetCategory, AvatarAsset } from "../../types/game";
import { resolveAssetImageUrl } from "../../utils/avatars";

type StatusFilter = "all" | "enabled" | "hidden";

export const AdminAssetManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { feedback, showToast } = useAppSettings();
  const { isAdmin, loading: authLoading, refreshAuth } = useAuth();
  const { refreshCatalog } = useAvatarCatalog();

  const [items, setItems] = useState<AvatarAsset[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeTab, setActiveTab] = useState<AssetCategory>("head");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [positionTarget, setPositionTarget] = useState<AvatarAsset | null>(null);
  const [animationTarget, setAnimationTarget] = useState<AvatarAsset | null>(null);
  const [editTarget, setEditTarget] = useState<AvatarAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AvatarAsset | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<AssetCategory>("head");
  const [editDescription, setEditDescription] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchAllAssets = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingList(true);
    try {
      const list = await adminListAvatarAssets();
      setItems(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể tải danh sách vật phẩm.",
        "error"
      );
    } finally {
      setLoadingList(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    fetchAllAssets();
  }, [fetchAllAssets]);

  const syncAfterMutation = useCallback(async () => {
    await Promise.all([fetchAllAssets(), refreshCatalog()]);
  }, [fetchAllAssets, refreshCatalog]);

  const stats = useMemo(() => {
    const counts: Record<AssetCategory, number> = {
      avatar: 0,
      head: 0,
      wings: 0,
      effects: 0,
      other: 0,
    };
    let enabled = 0;
    let hidden = 0;
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      if (item.enabled) enabled += 1;
      else hidden += 1;
    }
    return { counts, enabled, hidden, total: items.length };
  }, [items]);

  const existingIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (item.category !== activeTab) return false;
      if (statusFilter === "enabled" && !item.enabled) return false;
      if (statusFilter === "hidden" && item.enabled) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, statusFilter, searchQuery]);

  const openEditModal = (item: AvatarAsset) => {
    feedback("tap");
    setEditTarget(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditEnabled(item.enabled);
  };

  const handleToggleEnabled = async (item: AvatarAsset) => {
    setBusyId(item.id);
    feedback("tap");
    try {
      await adminUpdateAvatarAsset(item.id, { enabled: !item.enabled });
      await syncAfterMutation();
      feedback("success");
      showToast(
        !item.enabled
          ? `Đã bật "${item.name}" trong kho người chơi.`
          : `Đã ẩn "${item.name}" khỏi kho người chơi.`,
        "info"
      );
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    setSavingEdit(true);
    try {
      await adminUpdateAvatarAsset(editTarget.id, {
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim(),
        enabled: editEnabled,
      });
      await syncAfterMutation();
      feedback("success");
      showToast("Đã lưu thông tin vật phẩm!", "success");
      setEditTarget(null);
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể lưu thay đổi.",
        "error"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    try {
      await adminDeleteAvatarAsset(target.id);
      await syncAfterMutation();
      feedback("success");
      showToast(`Đã xóa "${target.name}" khỏi hệ thống.`, "info");
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể xóa vật phẩm.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSignOut = async () => {
    feedback("tap");
    await adminSignOut();
    await refreshAuth();
    navigate("/settings", { replace: true });
  };

  if (authLoading || !isAdmin) {
    return (
      <SkyBackdrop>
        <BrandHeader showBack onBack={() => navigate("/settings")} />
        <div className="chibi-card p-6 text-center my-auto font-display font-extrabold">
          ĐANG XÁC MINH QUYỀN ADMIN...
        </div>
      </SkyBackdrop>
    );
  }

  return (
    <SkyBackdrop>
      <BrandHeader
        showBack
        onBack={() => navigate("/settings")}
        rightExtra={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                feedback("tap");
                navigate("/admin");
              }}
              aria-label="Chuyển sang Kho từ khóa"
              title="Kho từ khóa"
              className="chibi-icon-circle bg-[#ADE7CF]"
            >
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Đăng xuất Admin"
              className="chibi-icon-circle bg-[#F8ADAD]"
            >
              <LogOut className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        }
      />

      <h1 className="chibi-title-3d text-[24px] sm:text-[28px] text-center mt-0.5 mb-2.5">
        QUẢN LÝ AVATAR &amp; PHỤ KIỆN
      </h1>

      <div className="chibi-card p-3.5 space-y-3 mb-6">
        {/* A. ADMIN DASHBOARD - THỐNG KÊ NHANH */}
        <div className="bg-[#FFF8EB] border-2 border-[#552416]/30 rounded-2xl p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-xs text-[#4A1D12]">
              <Sparkles className="w-4 h-4 text-[#E59B14]" />
              TỔNG QUAN KHO TÀI NGUYÊN ({stats.total})
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
              <span className="px-2 py-0.5 rounded-full bg-[#ADE7CF] border border-[#552416] text-[#166A45]">
                Bật: {stats.enabled}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-200 border border-[#552416]/50 text-gray-700">
                Ẩn: {stats.hidden}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {ASSET_CATEGORIES_META.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  feedback("tap");
                  setActiveTab(cat.id);
                }}
                className={`rounded-xl border-2 py-1.5 px-1 text-center transition-all cursor-pointer ${
                  activeTab === cat.id
                    ? "bg-[#FCEAD4] border-[#552416] shadow-[0_2px_0_#552416]"
                    : "bg-white border-[#552416]/30"
                }`}
              >
                <div className="text-sm leading-none">{cat.emoji}</div>
                <div className="font-display font-extrabold text-[10px] text-[#4A1D12] mt-0.5 truncate">
                  {cat.shortLabel}
                </div>
                <div className="text-[11px] font-extrabold text-[#6E402E]">
                  {stats.counts[cat.id]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thanh hành động Upload + Combo Preview + Refresh */}
        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              setUploadOpen(true);
            }}
            className="col-span-6 chibi-btn btn-mint !min-h-[44px] text-xs sm:text-sm py-2"
          >
            <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.6]" />
            <span>TẢI LÊN MỚI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              feedback("tap");
              setComboOpen(true);
            }}
            className="col-span-4 chibi-btn btn-yellow !min-h-[44px] text-xs py-2"
            title="Xem trước kết hợp nhiều hoạt ảnh"
          >
            <Layers className="w-4 h-4 stroke-[2.6]" />
            <span>THỬ COMBO</span>
          </button>
          <button
            type="button"
            disabled={loadingList}
            onClick={() => {
              feedback("tap");
              syncAfterMutation();
            }}
            className="col-span-2 chibi-btn btn-blue !min-h-[44px] text-xs py-2"
            title="Làm mới danh sách"
            aria-label="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tìm kiếm & Lọc trạng thái */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E402E]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, ID, mô tả..."
              className="chibi-input !py-2 !pl-9 !pr-2.5 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="col-span-5 chibi-input !py-2 !px-2.5 text-xs"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="enabled">Đang bật cho người chơi</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>

        {/* Chú thích phân loại hiện tại */}
        <div className="text-[11px] font-bold text-[#6E402E] bg-[#FDF8EE] border border-[#552416]/25 rounded-xl px-2.5 py-1.5">
          {CATEGORY_PRESET_MAP[activeTab].emoji}{" "}
          <span className="font-extrabold text-[#4A1D12]">
            {CATEGORY_PRESET_MAP[activeTab].label}:
          </span>{" "}
          {CATEGORY_PRESET_MAP[activeTab].hint}
        </div>

        {/* Danh sách vật phẩm */}
        <div className="space-y-2.5 max-h-[54vh] overflow-y-auto pr-0.5">
          {loadingList ? (
            <div className="text-center py-8 text-sm font-extrabold opacity-75">
              Đang tải danh sách vật phẩm...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-sm font-bold opacity-75">
              Chưa có vật phẩm nào phù hợp trong mục{" "}
              {CATEGORY_PRESET_MAP[activeTab].shortLabel}.
            </div>
          ) : (
            filteredItems.map((item) => {
              const imgUrl = resolveAssetImageUrl(item.image_url);
              const isBusy = busyId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border-[2.5px] border-[#552416] rounded-2xl p-2.5 flex flex-col gap-2 transition-opacity ${
                    item.enabled ? "bg-[#FDF8EE]" : "bg-[#EFEAE2] opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-16 h-16 rounded-2xl border-2 border-[#552416]/50 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #f3eee6 25%, transparent 25%), linear-gradient(-45deg, #f3eee6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3eee6 75%), linear-gradient(-45deg, transparent 75%, #f3eee6 75%)",
                        backgroundSize: "12px 12px",
                        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="w-14 h-14 object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-display font-extrabold text-sm text-[#4A1D12] truncate">
                          {item.name}
                        </span>
                        {item.is_builtin ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FCEAD4] border border-[#552416]/35 text-[10px] font-extrabold text-[#6E3B2B]">
                            Mặc định
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px] font-mono text-[#6E402E] truncate">
                        ID: {item.id}
                      </div>

                      {item.description ? (
                        <div className="text-[11px] font-bold text-[#6E402E] line-clamp-1">
                          {item.description}
                        </div>
                      ) : null}

                      <div className="text-[10px] font-extrabold text-[#552416]/80">
                        Tỉ lệ {item.scale.toFixed(2)}x • X {item.position_x}% • Y{" "}
                        {item.position_y}% • Z {item.z_index} •{" "}
                        {item.animation?.enabled === false
                          ? "Tĩnh"
                          : `Động: ${item.animation?.type ?? "idle"}`}
                      </div>
                    </div>
                  </div>

                  {/* Hàng nút quản lý nhanh */}
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleEnabled(item)}
                      className={`px-1.5 py-1.5 rounded-xl border-2 border-[#552416] text-[10px] font-extrabold flex items-center justify-center gap-0.5 cursor-pointer ${
                        item.enabled
                          ? "bg-[#ADE7CF] text-[#166A45]"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {item.enabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>BẬT</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          <span>ẨN</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditModal(item)}
                      className="px-1.5 py-1.5 rounded-xl border-2 border-[#552416] bg-[#FFDE84] text-[#4A1D12] text-[10px] font-extrabold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span>SỬA</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        feedback("tap");
                        setPositionTarget(item);
                      }}
                      className="px-1.5 py-1.5 rounded-xl border-2 border-[#552416] bg-[#BCEBFF] text-[#174A6B] text-[10px] font-extrabold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <Move className="w-3.5 h-3.5 shrink-0" />
                      <span>VỊ TRÍ</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        feedback("tap");
                        setAnimationTarget(item);
                      }}
                      className="px-1.5 py-1.5 rounded-xl border-2 border-[#552416] bg-[#E3D1FF] text-[#4B207E] text-[10px] font-extrabold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span>ĐỘNG</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        feedback("tap");
                        setDeleteTarget(item);
                      }}
                      className="px-1.5 py-1.5 rounded-xl border-2 border-[#552416] bg-[#F8ADAD] text-[#7D1916] text-[10px] font-extrabold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>XÓA</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Manager */}
      <AssetUploadModal
        open={uploadOpen}
        defaultCategory={activeTab}
        existingIds={existingIds}
        onClose={() => setUploadOpen(false)}
        onUploaded={syncAfterMutation}
      />

      {/* Position Editor */}
      <AssetPositionModal
        asset={positionTarget}
        allAssets={items}
        onClose={() => setPositionTarget(null)}
        onSaved={syncAfterMutation}
      />

      {/* Animation Editor */}
      <AssetAnimationModal
        asset={animationTarget}
        allAssets={items}
        onClose={() => setAnimationTarget(null)}
        onSaved={syncAfterMutation}
      />

      {/* Preview Combination Mode */}
      <AdminCombinationModal
        open={comboOpen}
        allAssets={items}
        onClose={() => setComboOpen(false)}
      />

      {/* Modal Sửa thông tin vật phẩm */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => !savingEdit && setEditTarget(null)}
        title="CHỈNH SỬA THÔNG TIN VẬT PHẨM"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-sm font-bold">
          <div>
            <label className="block text-xs font-extrabold text-[#552416] mb-1">
              Mã ID vật phẩm:
            </label>
            <input
              value={editTarget?.id ?? ""}
              disabled
              className="chibi-input text-xs font-mono opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#552416] mb-1">
              Tên vật phẩm *
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={60}
              required
              className="chibi-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#552416] mb-1">
              Phân loại *
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as AssetCategory)}
              className="chibi-input text-sm"
            >
              {ASSET_CATEGORIES_META.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label} ({cat.shortLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#552416] mb-1">
              Mô tả (tuỳ chọn)
            </label>
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              maxLength={120}
              className="chibi-input text-sm"
            />
          </div>

          <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editEnabled}
              onChange={(e) => setEditEnabled(e.target.checked)}
            />
            <span>Hiển thị trong kho cho tất cả người chơi</span>
          </label>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              disabled={savingEdit}
              onClick={() => setEditTarget(null)}
              className="chibi-btn btn-cream !min-h-[44px] py-2 text-sm"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={savingEdit || !editName.trim()}
              className="chibi-btn btn-mint !min-h-[44px] py-2 text-sm"
            >
              {savingEdit ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="XÓA VẬT PHẨM?"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa "${deleteTarget.name}" (${deleteTarget.id})? File ảnh liên quan (nếu là ảnh tải lên) sẽ bị xóa khỏi Storage và người chơi đang dùng sẽ tự động chuyển về trạng thái mặc định an toàn.`
            : ""
        }
        confirmLabel="XÓA NGAY"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SkyBackdrop>
  );
};
