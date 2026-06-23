import { motion } from "motion/react";
import { ArrowLeftRight, Languages } from "lucide-react";

interface LanguageSelectorProps {
  sourceLang: "zh" | "th";
  targetLang: "zh" | "th";
  onSwap: () => void;
}

export default function LanguageSelector({
  sourceLang,
  targetLang,
  onSwap,
}: LanguageSelectorProps) {
  const isZhToTh = sourceLang === "zh";

  return (
    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-3xl p-4 shadow-sm" id="lang-selector-bar">
      {/* Source Language Panel */}
      <div className="flex items-center gap-3 pl-2 flex-1">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
          <Languages className="w-5 h-5" />
        </div>
        <div className="text-left min-w-0">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">源语言</span>
          <span className="font-extrabold text-slate-700 text-sm md:text-base truncate">
            {isZhToTh ? "🇨🇳 中文 (Mandarin)" : "🇹🇭 泰语 (ภาษาไทย)"}
          </span>
        </div>
      </div>

      {/* Swap Button (Spin on click) */}
      <div className="px-2 shrink-0">
        <motion.button
          onClick={onSwap}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 180 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border border-slate-200/60 hover:border-emerald-200/50 rounded-2xl cursor-pointer shadow-sm transition-colors flex items-center justify-center"
          id="lang-swap-btn"
          title="切换翻译方向"
        >
          <ArrowLeftRight className="w-4.5 h-4.5" />
        </motion.button>
      </div>

      {/* Target Language Panel */}
      <div className="flex items-center gap-3 pr-2 flex-1 justify-end text-right">
        <div className="text-right min-w-0">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">目标语言</span>
          <span className="font-extrabold text-slate-800 text-sm md:text-base truncate">
            {isZhToTh ? "🇹🇭 泰语 (ภาษาไทย)" : "🇨🇳 中文 (Mandarin)"}
          </span>
        </div>
        <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
          <Languages className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
