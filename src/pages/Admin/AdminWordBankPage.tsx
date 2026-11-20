import React, { useCallback, useEffect, useState } from "react";
import {
  Download,
  Edit3,
  LogOut,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SkyBackdrop } from "../../components/layout/SkyBackdrop";
import { BrandHeader } from "../../components/common/BrandHeader";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  adminSignOut,
  createWordPair,
  deleteWordPair,
  exportWordPairs,
  importWordPairs,
  listWordPairs,
  updateWordPair,
  type WordPairFormInput,
} from "../../services/adminService";
import { formatDifficultyLabel, WORD_CATEGORIES_META } from "../../utils/avatars";
import type { Difficulty, WordCategory, WordPair } from "../../types/game";

const EMPTY_FORM: WordPairFormInput = {
  category: "Động vật",
  civilian_word: "",
  undercover_word: "",
  difficulty: "medium",
  note: "",
  is_active: true,
};

export const AdminWordBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, loading: authLoading, refreshAuth } = useAuth();
  const { feedback, showToast } = useAppSettings();

  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") ?? "Tất cả"
  );
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<WordPair[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Modal thêm/sửa
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<WordPairFormInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState<WordPair | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal nhập dữ liệu JSON
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchList = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingList(true);
    try {
      const data = await listWordPairs({
        category: categoryFilter,
        difficulty: difficultyFilter,
        search: searchQuery.trim(),
      });
      setItems(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể tải kho từ khóa.",
        "error"
      );
    } finally {
      setLoadingList(false);
    }
  }, [isAdmin, categoryFilter, difficultyFilter, searchQuery, showToast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormState({
      ...EMPTY_FORM,
      category:
        categoryFilter !== "Tất cả"
          ? (categoryFilter as WordCategory)
          : "Động vật",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (item: WordPair) => {
    setEditingId(item.id);
    setFormState({
      category: item.category,
      civilian_word: item.civilian_word,
      undercover_word: item.undercover_word,
      difficulty: item.difficulty,
      note: item.note,
      is_active: item.is_active,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formState.civilian_word.trim() || !formState.undercover_word.trim()) {
      setFormError("Vui lòng nhập đầy đủ Từ khóa Civilian và Từ khóa Undercover.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateWordPair(editingId, formState);
        showToast("Đã cập nhật cặp từ khóa!", "success");
      } else {
        await createWordPair(formState);
        showToast("Đã thêm cặp từ khóa mới!", "success");
      }
      feedback("success");
      setFormOpen(false);
      await fetchList();
    } catch (err) {
      feedback("alert");
      setFormError(
        err instanceof Error ? err.message : "Không thể lưu cặp từ khóa."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWordPair(deleteTarget.id);
      feedback("success");
      showToast("Đã xóa cặp từ khóa.", "success");
      setDeleteTarget(null);
      await fetchList();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể xóa cặp từ khóa.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const rows = await exportWordPairs();
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dathoineee-wordbank-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      feedback("success");
      showToast(`Đã xuất ${rows.length} cặp từ khóa!`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể xuất dữ liệu.",
        "error"
      );
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsed: WordPairFormInput[];
    try {
      const json = JSON.parse(importText);
      if (!Array.isArray(json)) {
        throw new Error("Dữ liệu JSON phải là một mảng danh sách.");
      }
      parsed = json;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "JSON không đúng định dạng.",
        "error"
      );
      return;
    }

    setImporting(true);
    try {
      const res = await importWordPairs(parsed);
      feedback("success");
      showToast(`Đã nhập thành công ${res.imported_count} cặp từ khóa!`, "success");
      setImportOpen(false);
      setImportText("");
      await fetchList();
    } catch (err) {
      feedback("alert");
      showToast(
        err instanceof Error ? err.message : "Không thể nhập dữ liệu.",
        "error"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportText(text);
  };

  const handleSignOut = async () => {
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
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Đăng xuất Admin"
            className="chibi-icon-circle bg-[#F8ADAD]"
          >
            <LogOut className="w-5 h-5 stroke-[2.5]" />
          </button>
        }
      />

      <h1 className="chibi-title-3d text-[25px] sm:text-[28px] text-center mt-0.5 mb-2.5">
        QUẢN TRỊ KHO TỪ KHÓA
      </h1>

      <div className="chibi-card p-3.5 space-y-3 mb-6">
        {/* Thanh công cụ Thêm / Nhập / Xuất */}
        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="col-span-12 sm:col-span-6 chibi-btn btn-mint !min-h-[44px] text-sm py-2"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>THÊM CẶP TỪ KHÓA</span>
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="col-span-6 sm:col-span-3 chibi-btn btn-blue !min-h-[44px] text-xs py-2"
          >
            <Upload className="w-4 h-4" />
            <span>NHẬP</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="col-span-6 sm:col-span-3 chibi-btn btn-yellow !min-h-[44px] text-xs py-2"
          >
            <Download className="w-4 h-4" />
            <span>XUẤT</span>
          </button>
        </div>

        {/* Tìm kiếm & Lọc */}
        <div className="chibi-section-peach p-2.5 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#552416] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ khóa Civilian, Undercover..."
              className="chibi-input !pl-9 !py-2 !text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Lọc theo danh mục"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="chibi-input !py-1.5 !px-3 !text-xs !rounded-xl"
            >
              <option value="Tất cả">Tất cả danh mục (8)</option>
              {WORD_CATEGORIES_META.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo độ khó"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="chibi-input !py-1.5 !px-3 !text-xs !rounded-xl"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        {/* Danh sách kết quả */}
        <div className="text-xs font-extrabold flex items-center justify-between px-1">
          <span>Tổng kết quả: {items.length} cặp</span>
          {loadingList ? <span>Đang tải...</span> : null}
        </div>

        <div className="space-y-2 max-h-[52dvh] overflow-y-auto pr-0.5">
          {items.length === 0 && !loadingList ? (
            <div className="text-center py-6 text-sm font-bold opacity-75">
              Không tìm thấy cặp từ khóa nào khớp bộ lọc.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFDF9] border-2 border-[#552416] rounded-2xl p-2.5 flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#FCEAD4] border border-[#552416]/40 text-[10px] font-extrabold text-[#4A1D12]">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFDE84] border border-[#552416]/40 text-[10px] font-extrabold text-[#4A1D12]">
                      {formatDifficultyLabel(item.difficulty)}
                    </span>
                    {!item.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-gray-200 text-[10px] font-extrabold text-gray-700">
                        Đã ẩn
                      </span>
                    ) : null}
                  </div>
                  <div className="font-display font-extrabold text-sm text-[#4A1D12]">
                    <span className="text-[#166A45]">{item.civilian_word}</span>
                    <span className="mx-1.5 opacity-60">vs</span>
                    <span className="text-[#B52B27]">{item.undercover_word}</span>
                  </div>
                  {item.note ? (
                    <div className="text-[11px] font-semibold text-[#6E402E]">
                      📝 {item.note}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Sửa ${item.civilian_word}`}
                    onClick={() => openEditModal(item)}
                    className="w-8 h-8 rounded-xl bg-[#FFDE84] border-2 border-[#552416] flex items-center justify-center text-[#552416] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xóa ${item.civilian_word}`}
                    onClick={() => setDeleteTarget(item)}
                    className="w-8 h-8 rounded-xl bg-[#F8ADAD] border-2 border-[#552416] flex items-center justify-center text-[#552416] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Thêm / Sửa cặp từ khóa */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "✏️ CHỈNH SỬA CẶP TỪ KHÓA" : "➕ THÊM CẶP TỪ KHÓA"}
      >
        <form onSubmit={handleSaveForm} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold mb-1">DANH MỤC</label>
            <select
              value={formState.category}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  category: e.target.value as WordCategory,
                }))
              }
              className="chibi-input !rounded-xl !py-2 !text-sm"
            >
              {WORD_CATEGORIES_META.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold mb-1">
              TỪ KHÓA CIVILIAN
            </label>
            <input
              type="text"
              value={formState.civilian_word}
              onChange={(e) =>
                setFormState((p) => ({ ...p, civilian_word: e.target.value }))
              }
              placeholder="VD: CON BÒ"
              className="chibi-input !rounded-xl !py-2 !text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold mb-1">
              TỪ KHÓA UNDERCOVER
            </label>
            <input
              type="text"
              value={formState.undercover_word}
              onChange={(e) =>
                setFormState((p) => ({ ...p, undercover_word: e.target.value }))
              }
              placeholder="VD: CON TRÂU"
              className="chibi-input !rounded-xl !py-2 !text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold mb-1">ĐỘ KHÓ</label>
            <select
              value={formState.difficulty}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  difficulty: e.target.value as Difficulty,
                }))
              }
              className="chibi-input !rounded-xl !py-2 !text-sm"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold mb-1">GHI CHÚ</label>
            <input
              type="text"
              value={formState.note}
              onChange={(e) =>
                setFormState((p) => ({ ...p, note: e.target.value }))
              }
              placeholder="Gợi ý ngữ cảnh (không bắt buộc)"
              className="chibi-input !rounded-xl !py-2 !text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
            <input
              type="checkbox"
              checked={formState.is_active ?? true}
              onChange={(e) =>
                setFormState((p) => ({ ...p, is_active: e.target.checked }))
              }
              className="w-4 h-4 accent-[#166A45]"
            />
            <span>Kích hoạt cặp từ khóa này để chia trong game</span>
          </label>

          {formError ? (
            <div className="chibi-section-warning border-2 border-[#B52B27] p-2 text-xs text-[#9E1C19]">
              ⚠️ {formError}
            </div>
          ) : null}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="chibi-btn btn-pink flex-1 !min-h-[44px] text-base"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={saving}
              className="chibi-btn btn-mint flex-1 !min-h-[44px] text-base"
            >
              {saving ? "ĐANG LƯU..." : "LƯU"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nhập dữ liệu JSON */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="📥 NHẬP DỮ LIỆU TỪ KHÓA (JSON)"
      >
        <form onSubmit={handleImportSubmit} className="space-y-3">
          <p className="text-xs font-semibold">
            Chọn file <code>.json</code> hoặc dán mảng JSON với các trường:{" "}
            <code>category</code>, <code>civilian_word</code>,{" "}
            <code>undercover_word</code>, <code>difficulty</code>, <code>note</code>.
          </p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="text-xs font-bold"
          />
          <textarea
            rows={6}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"category":"Động vật","civilian_word":"CON BÒ","undercover_word":"CON TRÂU","difficulty":"easy","note":""}]'
            className="w-full rounded-2xl border-2 border-[#552416] p-2.5 text-xs font-mono bg-white text-[#552416]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="chibi-btn btn-cream flex-1 !min-h-[42px] text-sm"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={importing || !importText.trim()}
              className="chibi-btn btn-mint flex-1 !min-h-[42px] text-sm"
            >
              {importing ? "ĐANG NHẬP..." : "NHẬP DỮ LIỆU"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận xóa */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="XÓA CẶP TỪ KHÓA?"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xóa cặp "${deleteTarget.civilian_word} / ${deleteTarget.undercover_word}" khỏi kho dữ liệu?`
            : ""
        }
        confirmLabel="XÓA NGAY"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SkyBackdrop>
  );
};
