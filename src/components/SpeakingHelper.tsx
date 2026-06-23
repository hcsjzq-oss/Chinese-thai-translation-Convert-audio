import { useState } from "react";
import { motion } from "motion/react";
import { Volume2, Star, Check, BookOpen, Lightbulb, Compass, HelpCircle, GraduationCap } from "lucide-react";
import { TranslationResult, FavoriteItem, VocabularyWord } from "../types";
import { speakText } from "../utils/speech";

interface SpeakingHelperProps {
  result: TranslationResult;
  sourceText: string;
  sourceLang: "zh" | "th";
  targetLang: "zh" | "th";
  favorites: FavoriteItem[];
  onToggleFavorite: (item: Omit<FavoriteItem, "id" | "createdAt">) => void;
}

export default function SpeakingHelper({
  result,
  sourceText,
  sourceLang,
  targetLang,
  favorites,
  onToggleFavorite,
}: SpeakingHelperProps) {
  const [playingState, setPlayingState] = useState<{ id: string; type: "phrase" | "word" | "example" | null }>({
    id: "",
    type: null,
  });

  // Check if fully translated phrase is already favorited
  const isPhraseFavorited = favorites.some(
    (f) => f.type === "phrase" && f.sourceText === sourceText && f.translatedText === result.translation
  );

  // Check if a specific vocab word is favorited
  const isWordFavorited = (word: VocabularyWord) => {
    return favorites.some(
      (f) => f.type === "word" && f.sourceText === word.source && f.translatedText === word.target
    );
  };

  const handleSpeak = (text: string, lang: "zh" | "th", id: string, type: "phrase" | "word" | "example") => {
    setPlayingState({ id, type });
    speakText(text, lang, () => {
      setPlayingState({ id: "", type: null });
    });
  };

  const handleTogglePhraseFav = () => {
    onToggleFavorite({
      type: "phrase",
      sourceText,
      translatedText: result.translation,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      phonetic: result.phonetic,
    });
  };

  const handleToggleWordFav = (word: VocabularyWord) => {
    onToggleFavorite({
      type: "word",
      sourceText: word.source,
      translatedText: word.target,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      phonetic: word.targetPhonetic,
      partOfSpeech: word.partOfSpeech,
      meaning: word.meaning,
    });
  };

  return (
    <div className="space-y-6" id="speaking-helper-panel">
      {/* 🥞 Result & Translation Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-900/10 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] bg-emerald-600/10 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              翻译完成
            </span>

            {/* Translation Output */}
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
              {result.translation}
            </h3>

            {/* Phonetic Pronunciation */}
            <div className="flex items-center gap-1.5 self-start text-xs md:text-sm text-slate-500 font-medium font-mono bg-white/50 backdrop-blur-sm py-1.5 px-3.5 rounded-full border border-slate-100 w-fit">
              <span className="text-emerald-600 font-semibold">读音助读:</span>
              <span>/{result.phonetic}/</span>
            </div>
          </div>

          <div className="flex items-center gap-2shrink-0">
            {/* Play main translation button */}
            <button
              onClick={() => handleSpeak(result.translation, targetLang, "main-translation", "phrase")}
              className={`p-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center ${
                playingState.type === "phrase" && playingState.id === "main-translation"
                  ? "bg-emerald-500 text-white animate-pulse shadow-emerald-200"
                  : "bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/60"
              }`}
              title="播放标准发音"
            >
              <Volume2 className="w-5.5 h-5.5" />
            </button>

            {/* Favorite text button */}
            <button
              onClick={handleTogglePhraseFav}
              className={`p-3.5 rounded-2xl transition-all border shadow-sm flex items-center justify-center ${
                isPhraseFavorited
                  ? "bg-amber-500 text-white border-amber-500 shadow-amber-200"
                  : "bg-white text-amber-500 hover:bg-amber-50 border-slate-200/60"
              }`}
              title={isPhraseFavorited ? "移出收藏夹" : "保存至收藏夹"}
            >
              <Star className={`w-5.5 h-5.5 ${isPhraseFavorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 🧠 Core Vocabulary Breakdown */}
      {result.words && result.words.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">本句核心词汇拆解</h4>
              <p className="text-xs text-slate-400">词汇部分，可单独学习并一键永久收藏</p>
            </div>
          </div>

          {/* Cards / Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.words.map((word, wordIdx) => {
              const favorited = isWordFavorited(word);
              return (
                <div
                  key={`${word.source}-${wordIdx}`}
                  className="group bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-500/[0.01] p-4.5 rounded-2xl transition-all flex flex-col justify-between gap-3 relative"
                >
                  <div className="space-y-1.5">
                    {/* Badge & Part of speech */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100/30 text-emerald-700">
                        {word.partOfSpeech}
                      </span>
                    </div>

                    {/* Word Contrast pairs */}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 text-base md:text-lg">{word.source}</span>
                      <span className="text-xs text-slate-400 font-medium">({word.sourcePhonetic})</span>
                    </div>

                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-extrabold text-emerald-600 text-base">{word.target}</span>
                      <span className="text-xs text-slate-400 font-mono">/{word.targetPhonetic}/</span>
                    </div>

                    {/* Bilingual Meaning Explanation */}
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      <span className="text-slate-400 font-normal">释义:</span> {word.meaning}
                    </p>
                  </div>

                  {/* Quick controls inside vocab */}
                  <div className="flex items-center gap-1.5 self-end border-t border-slate-100/80 pt-2 w-full justify-end">
                    <button
                      onClick={() => handleSpeak(word.target, targetLang, `${word.target}-${wordIdx}`, "word")}
                      className={`p-1.5 rounded-lg transition-all ${
                        playingState.type === "word" && playingState.id === `${word.target}-${wordIdx}`
                          ? "bg-emerald-500 text-white animate-pulse"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title="朗读单词"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleWordFav(word)}
                      className={`p-1.5 rounded-lg transition-all ${
                        favorited
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                      }`}
                      title={favorited ? "取消收藏此单词" : "收藏此单词"}
                    >
                      <Star className={`w-3.5 h-3.5 ${favorited ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 💬 Pronunciation Speaking & Polite Cultural Tips */}
      {result.speakingTips && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-sky-50/50 border border-sky-100 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="flex gap-3">
            <div className="p-2.5 bg-sky-200/50 text-sky-700 rounded-2xl shrink-0 h-fit">
              <Lightbulb className="w-5 h-5 fill-current stroke-1.5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm md:text-base">实用口语要领 & 文化小贴士</h4>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed break-words">
                {result.speakingTips}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 📚 Bilingual Sentence Examples */}
      {result.examples && result.examples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">实用场景演练例句</h4>
              <p className="text-xs text-slate-400">将掌握的句式和词汇，自由拓展应用至生活对话中</p>
            </div>
          </div>

          <div className="space-y-4">
            {result.examples.map((example, exIdx) => {
              return (
                <div
                  key={exIdx}
                  className="bg-slate-50/40 border border-slate-100 p-4 rounded-2xl relative flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Source sentence */}
                    <div>
                      <span className="font-semibold text-slate-700 text-sm">{example.source}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        ({example.sourcePhonetic})
                      </span>
                    </div>

                    <div className="border-t border-slate-100/50 my-1 md:hidden" />

                    {/* Target Translation sentence */}
                    <div>
                      <span className="font-bold text-emerald-600 text-sm">{example.target}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        /{example.targetPhonetic}/
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-end md:self-auto flex items-center gap-1.5">
                    <button
                      onClick={() => handleSpeak(example.target, targetLang, `example-${exIdx}`, "example")}
                      className={`p-2 rounded-xl transition-all ${
                        playingState.type === "example" && playingState.id === `example-${exIdx}`
                          ? "bg-emerald-500 text-white animate-pulse"
                          : "bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                      }`}
                      title="播放例句发音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onToggleFavorite({
                          type: "phrase",
                          sourceText: example.source,
                          translatedText: example.target,
                          sourceLanguage: sourceLang,
                          targetLanguage: targetLang,
                          phonetic: example.targetPhonetic,
                        });
                      }}
                      className="p-2 bg-slate-100 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      title="收藏此例句"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
