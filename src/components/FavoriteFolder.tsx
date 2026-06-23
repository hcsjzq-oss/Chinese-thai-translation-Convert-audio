import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Volume2, Star, Search, Filter, BookOpen, ExternalLink } from "lucide-react";
import { FavoriteItem } from "../types";
import { speakText } from "../utils/speech";

interface FavoriteFolderProps {
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  onLoadItem: (item: FavoriteItem) => void;
}

export default function FavoriteFolder({
  favorites,
  onRemoveFavorite,
  onClearAll,
  onLoadItem,
}: FavoriteFolderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "phrase" | "word">("all");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Filter and search favorites
  const filteredFavorites = favorites.filter((item) => {
    const matchesSearch =
      item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.meaning && item.meaning.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.phonetic && item.phonetic.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleSpeak = (text: string, lang: "zh" | "th", id: string) => {
    setPlayingId(id);
    speakText(text, lang, () => {
      setPlayingId(null);
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="favorites-section">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">语言收藏夹</h2>
            <p className="text-xs text-slate-500">已保存 {favorites.length} 个词汇与短句</p>
          </div>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={() => {
              if (confirm("确定要清空收藏夹吗？")) {
                onClearAll();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium border border-rose-100/50"
            id="clear-favorites-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空全部
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索已收藏词句..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
              id="favorite-search"
            />
          </div>

          <div className="flex bg-slate-50 p-1 border border-slate-200/60 rounded-xl self-start md:self-auto shrink-0">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                filterType === "all"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType("phrase")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                filterType === "phrase"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              短语段落
            </button>
            <button
              onClick={() => setFilterType("word")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                filterType === "word"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              核心词汇
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[460px] overflow-y-auto pr-1 space-y-3">
          <AnimatePresence initial={false}>
            {filteredFavorites.length > 0 ? (
              filteredFavorites.map((item, index) => {
                const isThaiTarget = item.targetLanguage === "th";
                const vocalText = isThaiTarget ? item.translatedText : item.sourceText;
                const vocalLang = isThaiTarget ? "th" : "zh";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-500/[0.015] p-4.5 rounded-2xl transition-all flex items-start gap-3 justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Badge / Metadata */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            item.type === "word"
                              ? "bg-sky-50 text-sky-600 border border-sky-100/50"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                          }`}
                        >
                          {item.type === "word" ? "单词" : "整句"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">
                          {item.sourceLanguage.toUpperCase()} ➔ {item.targetLanguage.toUpperCase()}
                        </span>
                        {item.partOfSpeech && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">
                            {item.partOfSpeech}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800 text-sm md:text-base leading-snug break-words">
                          {item.sourceText}
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-emerald-600 text-sm md:text-base break-words">
                            {item.translatedText}
                          </span>
                          <span className="text-xs text-slate-400 font-medium font-mono">
                            /{item.phonetic}/
                          </span>
                        </div>

                        {item.meaning && (
                          <p className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-slate-200">
                            释义: {item.meaning}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {/* Play Audio Button */}
                      <button
                        onClick={() => handleSpeak(item.translatedText, item.targetLanguage, item.id)}
                        className={`p-2 rounded-xl transition-all ${
                          playingId === item.id
                            ? "bg-emerald-50 text-emerald-600 animate-pulse"
                            : "bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                        }`}
                        title="发音朗读"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {/* Load to Translator for Phrase */}
                      {item.type === "phrase" && (
                        <button
                          onClick={() => onLoadItem(item)}
                          className="p-2 bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
                          title="在翻译器中查看解析"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFavorite(item.id)}
                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all"
                        title="移出收藏"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-14 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100 mb-3.5">
                  <BookOpen className="w-6 h-6 stroke-1.5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-1">
                  {searchQuery || filterType !== "all" ? "没有找到符合搜索的收藏" : "您的收藏夹空空如也"}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery || filterType !== "all"
                    ? "请换个搜索词或更改过滤类型后再试。"
                    : "翻译结果中的单词或句子，点击星号（⭐）收藏按钮即可永久保存至此。"}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
