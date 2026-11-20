import React from "react";
import { Modal } from "./Modal";
import roleCivilian from "../../assets/icons/role-civilian.png";
import roleUndercover from "../../assets/icons/role-undercover.png";
import roleMrWhite from "../../assets/icons/role-mrwhite.png";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="📖 HƯỚNG DẪN CHƠI">
      <div className="chibi-section-peach p-3 space-y-1.5">
        <div className="font-display font-extrabold text-base">
          🎯 Mục tiêu trò chơi
        </div>
        <p className="text-xs sm:text-sm font-semibold">
          Nhóm bạn ngồi cùng nhau ngoài đời thực. Mỗi người dùng điện thoại để nhận
          một từ khóa bí mật, sau đó đặt điện thoại xuống để thảo luận trực tiếp và
          truy tìm kẻ có từ khóa khác biệt!
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#DDF6EA] border-2 border-[#552416]">
          <img src={roleCivilian} alt="Dân thường" className="w-11 h-11 rounded-full shrink-0" />
          <div>
            <div className="font-display font-extrabold text-sm text-[#166A45]">
              DÂN THƯỜNG (CIVILIAN)
            </div>
            <div className="text-xs text-[#4A1D12]">
              Nhận chung một từ khóa (VD: CON BÒ). Tìm ra Gián điệp &amp; Mr. White.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#FFE3D6] border-2 border-[#552416]">
          <img src={roleUndercover} alt="Gián điệp" className="w-11 h-11 rounded-full shrink-0" />
          <div>
            <div className="font-display font-extrabold text-sm text-[#B52B27]">
              GIÁN ĐIỆP (UNDERCOVER)
            </div>
            <div className="text-xs text-[#4A1D12]">
              Nhận từ khóa gần nghĩa (VD: CON TRÂU). Hãy khéo léo hòa nhập để không bị lộ!
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#EAE0FF] border-2 border-[#552416]">
          <img src={roleMrWhite} alt="Mr. White" className="w-11 h-11 rounded-full shrink-0" />
          <div>
            <div className="font-display font-extrabold text-sm text-[#5B2E91]">
              MR. WHITE
            </div>
            <div className="text-xs text-[#4A1D12]">
              KHÔNG nhận được từ khóa! Nghe lén miêu tả của mọi người để đoán từ khóa của Dân thường.
            </div>
          </div>
        </div>
      </div>

      <div className="chibi-section-lavender p-3 space-y-1">
        <div className="font-display font-extrabold text-sm">
          🗣️ Các bước chơi cùng nhóm
        </div>
        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-1 font-semibold">
          <li>Một người tạo phòng, gửi mã 6 ký tự cho mọi người tham gia.</li>
          <li>Mỗi người tự xem từ khóa bí mật trên điện thoại rồi bấm ĐÃ NHỚ.</li>
          <li>Úp điện thoại xuống, lần lượt miêu tả từ khóa bằng 1 câu (không nói thẳng từ khóa).</li>
          <li>Thảo luận và tự chỉ tay bỏ phiếu ngoài đời thực để loại người khả nghi!</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="chibi-btn btn-mint w-full text-base"
      >
        ĐÃ HIỂU RỒI!
      </button>
    </Modal>
  );
};
