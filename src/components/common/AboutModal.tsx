import React from "react";
import { Modal } from "./Modal";
import homeChibiGroup from "../../assets/images/home-chibi-group.png";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="ℹ️ GIỚI THIỆU GAME">
      <div className="chibi-section-peach p-3 flex flex-col items-center text-center gap-2">
        <img
          src={homeChibiGroup}
          alt="Nhóm nhân vật DATHOINEEE"
          className="w-full max-w-[260px] h-auto rounded-xl"
        />
        <div className="font-display font-extrabold text-lg">
          AI LÀ GIÁN ĐIỆP? – DATHOINEEE
        </div>
        <p className="text-xs sm:text-sm font-semibold">
          Website hỗ trợ chia từ khóa bí mật &amp; đồng bộ thời gian thực cho các buổi
          tụ tập bạn bè chơi ngoài đời thực. Không quảng cáo, chơi mượt trên điện thoại!
        </p>
      </div>

      <div className="chibi-section-blue p-3 text-xs sm:text-sm font-semibold space-y-1">
        <div>✨ <strong>Thương hiệu:</strong> DATHOINEEE</div>
        <div>📱 <strong>Hỗ trợ:</strong> Điện thoại (PWA cài đặt như App) &amp; Máy tính</div>
        <div>🔒 <strong>Bảo mật:</strong> Từ khóa phân phối riêng từng thiết bị qua Supabase Edge Functions</div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="chibi-btn btn-yellow w-full text-base"
      >
        QUAY LẠI CHƠI THÔI!
      </button>
    </Modal>
  );
};
