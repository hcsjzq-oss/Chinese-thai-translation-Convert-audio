import { motion, AnimatePresence } from "motion/react";
import { History, Trash2, ArrowRight } from "lucide-react";

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: "zh" | "th";
  targetLang: "zh" | "th";
  timestamp: number;
}

interface HistoryListProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function HistoryList({
  history,
  onSelectHistory,
  onClearHistory,
}: HistoryListProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm" id="history-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4.5 h-4.5 text-slate-400" />
          <h3 className="font-bold text-slate-700 text-sm">最近翻译历史</h3>
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors font-medium"
        >
          <Trash2 className="w-3 h-3" />
          清空历史
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {history.map((item) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => onSelectHistory(item)}
              className="w-full text-left p-3.5 bg-slate-50/50 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-100/40 rounded-2xl transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs font-semibold text-slate-700 truncate">{item.sourceText}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                  <span className="font-medium text-emerald-600 truncate">{item.translatedText}</span>
                  <span>•</span>
                  <span>{item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
