import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppSettingsProvider } from "../contexts/AppSettingsContext";
import { AuthProvider } from "../contexts/AuthContext";
import { AvatarCatalogProvider } from "../contexts/AvatarCatalogContext";
import { AppRoutes } from "../App";
import { LayeredAvatar } from "../components/avatar/LayeredAvatar";
import { AvatarCustomizationModal } from "../components/avatar/AvatarCustomizationModal";
import {
  DEFAULT_AVATAR_CONFIG,
  FALLBACK_AVATAR_ASSETS,
  normalizeAvatarConfig,
  resolveAssetImageUrl,
} from "../utils/avatars";

function renderAt(route: string) {
  return render(
    <AppSettingsProvider>
      <AuthProvider>
        <AvatarCatalogProvider>
          <MemoryRouter initialEntries={[route]}>
            <AppRoutes />
          </MemoryRouter>
        </AvatarCatalogProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

describe("Giao diện AI LÀ GIÁN ĐIỆP – DATHOINEEE", () => {
  it("Màn hình Trang Chủ hiển thị đầy đủ logo, thương hiệu và 5 nút chức năng", () => {
    renderAt("/");
    expect(screen.getByText("DATHOINEEE")).toBeInTheDocument();
    expect(screen.getByText("AI LÀ")).toBeInTheDocument();
    expect(screen.getByText("GIÁN ĐIỆP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /TẠO PHÒNG MỚI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /THAM GIA PHÒNG/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HƯỚNG\s*DẪN/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /CÀI ĐẶT/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /GIỚI\s*THIỆU/i })).toBeInTheDocument();
  });

  it("Màn hình Tạo Phòng tính tự động Civilian khi thay đổi số người và vai trò", () => {
    renderAt("/create");
    expect(screen.getByRole("heading", { name: /TẠO PHÒNG MỚI/i })).toBeInTheDocument();
    expect(screen.getByText(/Tổng vai trò: 8 \/ 8 người chơi/i)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tăng số Mr. White" }));
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("Màn hình Tham Gia Phòng kiểm tra mã phòng 6 ký tự và tên trước khi gửi", () => {
    renderAt("/join");
    expect(screen.getByRole("heading", { name: /THAM GIA PHÒNG/i })).toBeInTheDocument();
    const joinBtn = screen.getByRole("button", { name: /THAM GIA PHÒNG/i });
    fireEvent.click(joinBtn);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Mã phòng không hợp lệ/i
    );
  });

  it("Màn hình Cài Đặt ẩn hoàn toàn danh mục & số lượng từ khóa đối với người dùng không phải Admin", () => {
    renderAt("/settings");
    expect(screen.getByText(/CÀI ĐẶT CHUNG/i)).toBeInTheDocument();
    expect(screen.getByText(/KHU VỰC DÀNH RIÊNG CHO ADMIN/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ĐĂNG NHẬP ADMIN/i })).toBeInTheDocument();

    // Tuyệt đối không lộ danh mục hay số lượng từ khóa cho người chơi bình thường
    expect(screen.queryByText(/120 cặp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ĐỘNG VẬT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CON BÒ/i)).not.toBeInTheDocument();
  });

  it("Màn hình Quản Trị từ chối truy cập nếu chưa đăng nhập Admin", () => {
    renderAt("/admin");
    expect(screen.queryByText(/THÊM CẶP TỪ KHÓA/i)).not.toBeInTheDocument();
  });

  it("Màn hình Quản Lý Avatar từ chối truy cập nếu chưa đăng nhập Admin", () => {
    renderAt("/admin/assets");
    expect(screen.queryByText(/TẢI LÊN AVATAR/i)).not.toBeInTheDocument();
  });

  it("LayeredAvatar giữ vòng tròn cho avatar gốc và overflow-visible cho cánh/phụ kiện", () => {
    const { container } = render(
      <AppSettingsProvider>
        <AvatarCatalogProvider>
          <LayeredAvatar
            size={80}
            config={{
              avatarId: "avatar-cat",
              headId: "head-crown",
              wingsId: "wings-angel",
              effectsId: "effect-sparkles",
              otherIds: ["other-star-badge"],
            }}
          />
        </AvatarCatalogProvider>
      </AppSettingsProvider>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveClass("overflow-visible");

    const avatarImg = screen.getByAltText("Mèo con tam thể");
    const circleWrapper = avatarImg.parentElement as HTMLElement;
    expect(circleWrapper).toHaveClass("rounded-full", "overflow-hidden");
    expect(circleWrapper.style.zIndex).toBe("20");

    const accessoryImgs = container.querySelectorAll('img[aria-hidden="true"]');
    expect(accessoryImgs.length).toBe(4);
    const zIndexes = Array.from(accessoryImgs).map((el) =>
      Number((el as HTMLElement).style.zIndex)
    );
    // Cánh z_index=10 < avatar=20; head=32, effects=40, other=45 nằm phía trên
    expect(zIndexes[0]).toBeLessThan(20);
    expect(zIndexes.some((z) => z > 20)).toBe(true);
  });

  it("Chuẩn hóa cấu hình avatar an toàn khi vật phẩm bị Admin xóa hoặc ẩn", () => {
    const partialCatalog = FALLBACK_AVATAR_ASSETS.filter(
      (a) => a.id !== "wings-angel" && a.id !== "avatar-ghost"
    );
    const normalized = normalizeAvatarConfig(
      {
        avatarId: "avatar-ghost",
        headId: "head-crown",
        wingsId: "wings-angel",
        effectsId: "effect-sparkles",
        otherIds: ["other-star-badge", "other-deleted"],
      },
      partialCatalog
    );

    expect(normalized.avatarId).toBe("avatar_01");
    expect(normalized.headId).toBe("head-crown");
    expect(normalized.wingsId).toBeNull();
    expect(normalized.effectsId).toBe("effect-sparkles");
    expect(normalized.otherIds).toEqual(["other-star-badge"]);
  });

  it("Popup Avatar Customization cho phép chuyển 5 tab, đổi avatar giữ phụ kiện và chọn nhiều OTHER", () => {
    const onConfirm = vi.fn();
    render(
      <AppSettingsProvider>
        <AvatarCatalogProvider>
          <AvatarCustomizationModal
            open
            initialConfig={DEFAULT_AVATAR_CONFIG}
            onClose={vi.fn()}
            onConfirm={onConfirm}
          />
        </AvatarCatalogProvider>
      </AppSettingsProvider>
    );

    // Đủ 5 tab
    expect(screen.getByRole("tab", { name: /AVATAR/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /HEAD/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /WINGS/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /EFFECTS/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /OTHER/i })).toBeInTheDocument();

    // Chọn Vương miện ở tab HEAD
    fireEvent.click(screen.getByRole("tab", { name: /HEAD/i }));
    fireEvent.click(screen.getByRole("button", { name: /Vương miện hoàng gia/i }));

    // Chọn Cánh thiên thần ở tab WINGS
    fireEvent.click(screen.getByRole("tab", { name: /WINGS/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cánh thiên thần/i }));

    // Đổi sang Avatar Mèo con phải giữ nguyên phụ kiện vừa chọn
    fireEvent.click(screen.getByRole("tab", { name: /AVATAR/i }));
    fireEvent.click(screen.getByRole("button", { name: /Mèo con tam thể/i }));

    // Chọn nhiều phụ kiện ở tab OTHER
    fireEvent.click(screen.getByRole("tab", { name: /OTHER/i }));
    fireEvent.click(screen.getByRole("button", { name: /Huy hiệu ngôi sao/i }));
    fireEvent.click(screen.getByRole("button", { name: /Kính lúp thám tử/i }));

    fireEvent.click(screen.getByRole("button", { name: /CONFIRM/i }));
    expect(onConfirm).toHaveBeenCalledWith({
      avatarId: "avatar-cat",
      headId: "head-crown",
      wingsId: "wings-angel",
      effectsId: null,
      otherIds: ["other-star-badge", "other-magnifier"],
    });
  });

  it("Màn hình Tạo Phòng và Tham Gia Phòng mở được popup Tùy chỉnh Avatar khi bấm vào avatar", () => {
    const view = renderAt("/create");
    fireEvent.click(
      screen.getByRole("button", { name: /Mở tùy chỉnh avatar và phụ kiện/i })
    );
    expect(screen.getByText(/TÙY CHỈNH AVATAR/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /WINGS/i })).toBeInTheDocument();

    view.unmount();

    renderAt("/join");
    fireEvent.click(
      screen.getByRole("button", { name: /Mở tùy chỉnh avatar và phụ kiện/i })
    );
    expect(screen.getByText(/TÙY CHỈNH AVATAR/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /HEAD/i })).toBeInTheDocument();
  });

  it("Kho tài nguyên có đủ 8 avatar tham chiếu mới + >= 20 phụ kiện ở 4 nhóm và resolve sạch URL", () => {
    const avatars = FALLBACK_AVATAR_ASSETS.filter((a) => a.category === "avatar");
    const heads = FALLBACK_AVATAR_ASSETS.filter((a) => a.category === "head");
    const wings = FALLBACK_AVATAR_ASSETS.filter((a) => a.category === "wings");
    const effects = FALLBACK_AVATAR_ASSETS.filter((a) => a.category === "effects");
    const others = FALLBACK_AVATAR_ASSETS.filter((a) => a.category === "other");

    for (let i = 1; i <= 8; i++) {
      expect(avatars.some((a) => a.id === `avatar_0${i}`)).toBe(true);
    }
    expect(heads.length).toBeGreaterThanOrEqual(5);
    expect(wings.length).toBeGreaterThanOrEqual(5);
    expect(effects.length).toBeGreaterThanOrEqual(5);
    expect(others.length).toBeGreaterThanOrEqual(5);

    const totalAccessories =
      heads.length + wings.length + effects.length + others.length;
    expect(totalAccessories).toBeGreaterThanOrEqual(20);

    for (const item of FALLBACK_AVATAR_ASSETS) {
      const resolved = resolveAssetImageUrl(item.image_url);
      expect(resolved).toBeTruthy();
      expect(resolved).not.toContain("builtin:");
    }
  });

  it("Popup hỗ trợ tháo phụ kiện (KHÔNG SỬ DỤNG), RESET về mặc định và CANCEL giữ nguyên", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <AppSettingsProvider>
        <AvatarCatalogProvider>
          <AvatarCustomizationModal
            open
            initialConfig={{
              avatarId: "avatar_06",
              headId: "head_03_witch_hat",
              wingsId: "wings_05_rainbow",
              effectsId: "effects_01_halo",
              otherIds: ["other_04_ghost_pet"],
            }}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        </AvatarCatalogProvider>
      </AppSettingsProvider>
    );

    // Tháo phụ kiện ở tab HEAD bằng nút KHÔNG SỬ DỤNG
    fireEvent.click(screen.getByRole("tab", { name: /HEAD/i }));
    fireEvent.click(screen.getByRole("button", { name: /KHÔNG SỬ DỤNG/i }));

    // Bấm RESET để quay về DEFAULT_AVATAR_CONFIG
    fireEvent.click(screen.getByRole("button", { name: /RESET/i }));
    fireEvent.click(screen.getByRole("button", { name: /CONFIRM/i }));
    expect(onConfirm).toHaveBeenCalledWith(DEFAULT_AVATAR_CONFIG);

    // Bấm CANCEL không gọi onConfirm lần nữa
    fireEvent.click(screen.getByRole("button", { name: /CANCEL/i }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
