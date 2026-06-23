import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Sparkles,
  Info,
  Languages,
  BookMarked,
  X,
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertCircle
} from "lucide-react";
import { TranslationResult, FavoriteItem, VocabularyWord } from "./types";
import { isSpeechRecognitionSupported, getSpeechRecognition, speakText } from "./utils/speech";
import LanguageSelector from "./components/LanguageSelector";
import SpeakingHelper from "./components/SpeakingHelper";
import FavoriteFolder from "./components/FavoriteFolder";
import HistoryList, { HistoryItem } from "./components/HistoryList";

// Scenarized quick presets for testing the language app
const TRAVEL_PRESETS = [
  {
    category: "🛎️ 日常问候",
    zh: "你好，很高兴认识你！请问你今天过得怎么样？",
    th: "สวัสดีครับ ยินดีที่ได้รู้จักครับ! วันนี้คุณเป็นอย่างไรบ้างครับ?",
    lang: "zh"
  },
  {
    category: "🍽️ 畅品美食",
    zh: "请问这个菜辣不辣？我想点一份少辣的招牌泰式炒粉。",
    th: "เมนูนี้เผ็ดไหมครับ? ฉันอยากสั่งผัดไทยสูตรเด็ดแบบเผ็ดน้อยหนึ่งที่ครับ",
    lang: "zh"
  },
  {
    category: "🚕 交通出行",
    zh: "师傅您好，请问载我去最近的地铁站需要多少钱？",
    th: "สวัสดีครับพี่คนขับ ไปสถานีรถไฟฟ้าที่ใกล้ที่สุดราคาเท่าไหร่ครับ?",
    lang: "zh"
  },
  {
    category: "🇹🇭 实用泰语",
    zh: "คุณช่วยแนะนำสถานที่ท่องเที่ยวที่น่าสนใจแถวนี้หน่อยได้ไหมครับ?",
    th: "คุณช่วยแนะนำสถานที่ท่องเที่ยวที่น่าสนใจแถวนี้หน่อยได้ไหมครับ?",
    lang: "th"
  },
  {
    category: "🛍️ 快乐购物",
    zh: "老板好，这个手工艺品非常漂亮，请问还可以便宜一点吗？",
    th: "สวัสดีครับพี่ งานฝีมือชิ้นนี้สวยงามมากครับ ลดราคากว่านี้อีกนิดได้ไหมครับ?",
    lang: "zh"
  }
];

export default function App() {
  const [inputText, setInputText] = useState("");
  const [sourceLang, setSourceLang] = useState<"zh" | "th">("zh");
  const [targetLang, setTargetLang] = useState<"zh" | "th">("th");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorites & History states
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Initialize data on mount
  useEffect(() => {
    // 1. Initial Load of Favorites from Local Storage
    const storedFavs = localStorage.getItem("th_zh_translator_favorites");
    if (storedFavs) {
      try {
        setFavorites(JSON.parse(storedFavs));
      } catch (e) {
        console.error("Failed to parse favorites:", e);
      }
    }

    // 2. Initial Load of History from Local Storage
    const storedHistory = localStorage.getItem("th_zh_translator_history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }

    // 3. Initialize SpeechRecognition if supported
    const SpeechRec = getSpeechRecognition();
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      recognitionRef.current = rec;
    }
  }, []);

  // Sync favorites of Vocabulary and phrases to local storage
  const saveFavorites = (newFavs: FavoriteItem[]) => {
    setFavorites(newFavs);
    localStorage.setItem("th_zh_translator_favorites", JSON.stringify(newFavs));
  };

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("th_zh_translator_history", JSON.stringify(newHistory));
  };

  // Perform Gemini translation request
  const handleTranslate = async (textToTranslate = inputText) => {
    const trimmedText = textToTranslate.trim();
    if (!trimmedText) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "翻译服务暂时不可用，请稍后再试。");
      }

      const data: TranslationResult = await response.json();
      setResult(data);

      // Add to search history list (limit to 6 entries)
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        sourceText: trimmedText,
        translatedText: data.translation,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
      };

      const revisedHistory = [
        newHistoryItem,
        ...history.filter((h) => h.sourceText !== trimmedText),
      ].slice(0, 6);

      saveHistory(revisedHistory);
    } catch (err: any) {
      console.error("Translation Client Error:", err);
      setError(err.message || "请求服务器时发生未知错误。");
    } finally {
      setLoading(false);
    }
  };

  // Swap language directions
  const handleSwapLanguages = () => {
    const prevSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prevSource);
    setInputText("");
    setResult(null);
    setInterimTranscript("");
    if (isRecording) {
      stopRecording();
    }
  };

  // Toggle dynamic single item Bookmark (phrase or specific word)
  const handleToggleFavorite = (newItem: Omit<FavoriteItem, "id" | "createdAt">) => {
    const isExist = favorites.find(
      (f) =>
        f.type === newItem.type &&
        f.sourceText === newItem.sourceText &&
        f.translatedText === newItem.translatedText
    );

    if (isExist) {
      // Remove it
      const updated = favorites.filter((f) => f.id !== isExist.id);
      saveFavorites(updated);
    } else {
      // Add it
      const fullItem: FavoriteItem = {
        ...newItem,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      saveFavorites([fullItem, ...favorites]);
    }
  };

  const handleRemoveFavoriteById = (id: string) => {
    saveFavorites(favorites.filter((f) => f.id !== id));
  };

  const handleClearAllFavorites = () => {
    saveFavorites([]);
  };

  const handleClearAllHistory = () => {
    saveHistory([]);
  };

  // Loader for favorited item back into standard view
  const handleLoadFavorite = (item: FavoriteItem) => {
    setInputText(item.sourceText);
    setSourceLang(item.sourceLanguage);
    setTargetLang(item.targetLanguage);
    // Direct result loading or trigger translation automatically
    handleTranslate(item.sourceText);
    // Smooth scroll to top of translation section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading item from translation history click
  const handleLoadHistory = (item: HistoryItem) => {
    setInputText(item.sourceText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    handleTranslate(item.sourceText);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Speech Recognition control cycle
  const startRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError("您的浏览器不支持语音识别功能，请换用Chrome或Safari浏览器。");
      return;
    }

    setSpeechError(null);
    setInterimTranscript("");
    setIsRecording(true);

    const recognition = recognitionRef.current;
    
    // Set appropriate language for speech engine
    recognition.lang = sourceLang === "zh" ? "zh-CN" : "th-TH";

    recognition.onstart = () => {
      console.log("Speech recognition successfully started");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setInputText((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechError("麦克风权限已被拒绝，请开启麦克风权限后使用语音输入。");
      } else {
        setSpeechError(`语音识别发生错误: ${event.error}`);
      }
      stopRecording();
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
    setIsRecording(false);
    setInterimTranscript("");
  };

  const handleSpeakerPlaybackSource = () => {
    if (inputText.trim()) {
      speakText(inputText, sourceLang);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/20 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 🎨 Elegant Header Brand */}
        <header className="text-center space-y-3.5" id="app-header">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-emerald-600/10 text-emerald-700 font-bold text-xs uppercase tracking-wider py-1.5 px-4.5 rounded-full border border-emerald-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            全新 Gemini-3.5 智能双语翻译套件
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none gap-2">
            中泰双语 <span className="text-emerald-600 bg-clip-text">语音翻译系统</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base font-normal">
            支持实时连续麦克风语音录入，一键生成精细拼音/拼音谐音注音及词汇分解。双语发音朗读，专为中泰互学、商业差旅而打造。
          </p>
        </header>

        {/* 🚀 Main Core Panel Grid: Left column handles operations, Right column handles books/vocabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CHANNELS: 8 Columns for Translator Inputs and Dynamic cards */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Language Direction Row Selector */}
            <LanguageSelector
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSwap={handleSwapLanguages}
            />

            {/* Translation Input Area */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4" id="input-container">
              
              {/* Text Input Block */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    sourceLang === "zh"
                      ? "在此输入或朗读中文短句..."
                      : "พิมพ์หรือพูดภาษาไทยเพื่อแปล..."
                  }
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium resize-none"
                  id="source-textarea"
                />

                {/* Speech Recording real-time stream status preview */}
                <AnimatePresence>
                  {(isRecording || interimTranscript) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-3 left-4 right-4 bg-emerald-500/95 backdrop-blur text-white text-xs py-2.5 px-4 rounded-xl flex items-center justify-between shadow-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-3">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                        </span>
                        <p className="truncate font-medium">
                          {interimTranscript ? `正在拼写: "${interimTranscript}"` : "正在倾听您的讲话，请面对麦克风..."}
                        </p>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="text-[10px] bg-white/20 hover:bg-white/35 text-white font-bold py-1 px-2.5 rounded-md transition-colors shrink-0"
                      >
                        完成
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error messages block (Speech or API error) */}
              {speechError && (
                <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl flex items-start gap-2.5 text-xs font-semibold border border-rose-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{speechError}</span>
                </div>
              )}

              {/* Actions Footer Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
                <div className="flex items-center gap-2">
                  
                  {/* Microphone Recorder button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`py-2 px-4 rounded-2xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border ${
                      isRecording
                        ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-200 animate-pulse"
                        : "bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200/80 hover:bg-slate-100"
                    }`}
                    id="mic-record-btn"
                    title={isRecording ? "停止录音" : "开启实时语音识别输入"}
                  >
                    {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5 text-emerald-600" />}
                    <span>{isRecording ? "正在倾听" : "语音录入"}</span>
                  </button>

                  {/* Play Input Vocal Audio */}
                  {inputText.trim() && (
                    <button
                      onClick={handleSpeakerPlaybackSource}
                      type="button"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200/50 rounded-2xl transition-all cursor-pointer"
                      title="朗读原文"
                    >
                      <Volume2 className="w-4.5 h-4.5" />
                    </button>
                  )}

                  {/* Clear Input text */}
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText("");
                        setResult(null);
                        setInterimTranscript("");
                      }}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium rounded-lg"
                    >
                      清空输入
                    </button>
                  )}
                </div>

                {/* Submit translating request */}
                <button
                  onClick={() => handleTranslate()}
                  disabled={loading || !inputText.trim()}
                  className={`py-2 px-5.5 rounded-2xl text-sm font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                    loading || !inputText.trim()
                      ? "bg-slate-200 text-slate-400 shadow-none border border-slate-200/50 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                  }`}
                  id="submit-translate-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>探索翻译中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>AI 智能翻译</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-3xl flex items-start gap-3"
              >
                <div className="p-1.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                  <X className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-rose-800">翻译请求发生错误</h4>
                  <p className="text-xs leading-relaxed text-rose-600">{error}</p>
                </div>
              </motion.div>
            )}

            {/* 💡 Translation Details Render (Phonetics, Words breakdown, Examples) */}
            {result ? (
              <SpeakingHelper
                result={result}
                sourceText={inputText}
                sourceLang={sourceLang}
                targetLang={targetLang}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              !loading && (
                <div className="bg-white/80 backdrop-blur rounded-3xl border border-slate-100/80 p-8 text-center shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 mb-4 animate-pulse">
                    <Sparkles className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-extrabold text-slate-700 text-base mb-1">准备就绪，开启您的学习之旅</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    在输入框输入任何中文、词汇或者泰语，然后点击 “AI 智能翻译” 即可快速体验。
                  </p>
                </div>
              )
            )}

            {/* Scenarized presets card (Travel companion helper) */}
            <div className="bg-white/50 border border-slate-100 rounded-3xl p-6 space-y-4">
              <div>
                <h4 className="font-bold text-slate-700 text-sm">💡 多场景快捷体验卡</h4>
                <p className="text-[11px] text-slate-400">点击以下预设语句，即可秒速填充并体验智能词句精析</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TRAVEL_PRESETS.map((preset, index) => {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(preset.lang === "zh" ? preset.zh : preset.th);
                        setSourceLang(preset.lang as any);
                        setTargetLang(preset.lang === "zh" ? "th" : "zh");
                        handleTranslate(preset.lang === "zh" ? preset.zh : preset.th);
                      }}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200/50 text-slate-600 text-xs rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{preset.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Translation Search History */}
            <HistoryList
              history={history}
              onSelectHistory={handleLoadHistory}
              onClearHistory={handleClearAllHistory}
            />

          </div>

          {/* RIGHT CHANNELS: 5 Columns dedicated exclusively to Vocabulary Favorite Folder Bookmarks */}
          <div className="lg:col-span-5 space-y-6">
            <FavoriteFolder
              favorites={favorites}
              onRemoveFavorite={handleRemoveFavoriteById}
              onClearAll={handleClearAllFavorites}
              onLoadItem={handleLoadFavorite}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
