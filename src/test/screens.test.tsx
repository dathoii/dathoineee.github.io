import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppSettingsProvider } from "../contexts/AppSettingsContext";
import { AuthProvider } from "../contexts/AuthContext";
import { AppRoutes } from "../App";

function renderAt(route: string) {
  return render(
    <AppSettingsProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
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
});
