import React from "react";
import { Check } from "lucide-react";
import { AVATAR_OPTIONS } from "../../utils/avatars";
import { useAppSettings } from "../../contexts/AppSettingsContext";

interface AvatarSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedId,
  onSelect,
  compact = false,
}) => {
  const { feedback } = useAppSettings();

  return (
    <div className="chibi-section-peach px-2.5 py-2.5">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-1">
        {AVATAR_OPTIONS.map((av) => {
          const isSelected = selectedId === av.id;
          return (
            <button
              key={av.id}
              type="button"
              onClick={() => {
                feedback("tap");
                onSelect(av.id);
              }}
              aria-label={`Chọn avatar ${av.label}`}
              aria-pressed={isSelected}
              className={`relative shrink-0 rounded-full transition-transform cursor-pointer ${
                compact ? "w-12 h-12" : "w-[62px] h-[62px]"
              } ${
                isSelected
                  ? "scale-105 ring-4 ring-[#F6BE3D] border-[3px] border-[#552416]"
                  : "border-[2.5px] border-[#552416]/75 opacity-90 hover:opacity-100"
              }`}
              style={{ backgroundColor: av.ringColor }}
            >
              <img
                src={av.src}
                alt={av.label}
                className="w-full h-full rounded-full object-cover"
                draggable={false}
              />
              {isSelected ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1EA454] border-2 border-white flex items-center justify-center text-white shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
