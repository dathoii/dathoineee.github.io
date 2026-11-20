import React from "react";
import { Minus, Plus } from "lucide-react";
import { useAppSettings } from "../../contexts/AppSettingsContext";

interface StepperControlProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  unitLabel?: string;
  ariaLabel: string;
}

export const StepperControl: React.FC<StepperControlProps> = ({
  value,
  min,
  max,
  onChange,
  unitLabel,
  ariaLabel,
}) => {
  const { feedback } = useAppSettings();

  return (
    <div className="inline-flex items-center gap-2.5">
      <button
        type="button"
        aria-label={`Giảm ${ariaLabel}`}
        disabled={value <= min}
        onClick={() => {
          feedback("tap");
          onChange(Math.max(min, value - 1));
        }}
        className="w-10 h-10 rounded-xl bg-[#F8ADAD] border-[2.5px] border-[#552416] shadow-[0_3px_0_#D67679] flex items-center justify-center text-[#552416] cursor-pointer active:translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed"
      >
        <Minus className="w-5 h-5 stroke-[3.5]" />
      </button>

      <div className="min-w-[44px] text-center">
        <div className="font-display font-extrabold text-2xl leading-none">
          {value < 10 ? `0${value}` : value}
        </div>
        {unitLabel ? (
          <div className="text-[11px] font-bold leading-tight opacity-85">
            {unitLabel}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-label={`Tăng ${ariaLabel}`}
        disabled={value >= max}
        onClick={() => {
          feedback("tap");
          onChange(Math.min(max, value + 1));
        }}
        className="w-10 h-10 rounded-xl bg-[#ADE7CF] border-[2.5px] border-[#552416] shadow-[0_3px_0_#66B896] flex items-center justify-center text-[#552416] cursor-pointer active:translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed"
      >
        <Plus className="w-5 h-5 stroke-[3.5]" />
      </button>
    </div>
  );
};
