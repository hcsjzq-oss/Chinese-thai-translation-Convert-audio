import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Global client reference for reuse
let aiInstance: GoogleGenAI | null = null;

// Lazy-checking and initializing GoogleGenAI Client
const getAIClient = (): { client: GoogleGenAI | null; error?: string } => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    return {
      client: null,
      error: "未检测到有效的 GEMINI_API_KEY 密钥。请您通过 AI Studio 界面右上角的「Settings > Secrets」面板配置您的 GEMINI_API_KEY 秘钥，或者在本地环境检查 .env 配置文件，然后刷新页面重试。",
    };
  }
  
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return { client: aiInstance };
};

// Translation API endpoint
app.post("/api/translate", async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({ error: "缺少必要的位置翻译参数：text, sourceLang, targetLang" });
  }

  // Lazy initialize client and check API keys on-demand
  const { client, error: keyError } = getAIClient();
  if (!client || keyError) {
    return res.status(401).json({
      error: keyError || "Gemini API 客户端未能正确初始化。",
    });
  }

  const isZhToTh = sourceLang === "zh" && targetLang === "th";

  // Customize instructions based on direction
  const systemInstruction = 
    "You are an elite bilingual translation assistant, native linguist, and professional language tutor specializing in Chinese and Thai.\n" +
    "Your objective is to translate user inputs accurately, capturing natural spoken registers, cultural context, and polite tones.\n" +
    "Importantly, you will provide premium reading guides:\n" +
    "- Standard Pinyin with clear accent tone marks for Chinese (e.g., 'Nǐ hǎo', 'Sāwǎtdī').\n" +
    "- Beautiful phonetic/karaoke phonetics with hyphenated syllables for Thai, showing beginners how to pronounce the Thai characters correctly (e.g., 'sa-wat-dee-khrap' or 'kin-khao-rue-yang'). Include tone guides if possible.\n" +
    "You will perform a granular breakdown of vocabulary keywords, explaining parts of speech ('动词', '名词', '代词', '形容词', '副词', '助词', etc.) and contextual local meaning.\n" +
    "Deliver the translation result in strict compliance with the requested JSON schema. Never include markdown text wrap like ```json or supplementary commentary exterior to the JSON.";

  const userPrompt = `Translate the following text from ${isZhToTh ? "Chinese (中文)" : "Thai (泰语)"} to ${isZhToTh ? "Thai (泰语)" : "Chinese (中文)"}:
Text: "${text}"

Provide a direct translation, phonetic guides (transcriptions) for the entire target translation and also the source elements when applicable, a comprehensive word-by-word vocabulary analyzer of core terms, at least 2 relevant modern example sentences, and helpful spoken cultural or polite ending tips (e.g., explaining 'khrap'/'kha' for Thai, or appropriate politeness levels).`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            translation: {
              type: "STRING",
              description: "The direct, natural translation of the text in the target language.",
            },
            phonetic: {
              type: "STRING",
              description: "Full phonetic pronunciation guide of the translated text. (e.g., Pinyin for Chinese, or hyphen-spaced readable Karaoke phonetics for Thai).",
            },
            words: {
              type: "ARRAY",
              description: "Breakdown of the 2-6 most important words or phrases contained in the text for vocabulary building.",
              items: {
                type: "OBJECT",
                properties: {
                  source: {
                    type: "STRING",
                    description: "The component word/phrase in the source language.",
                  },
                  target: {
                    type: "STRING",
                    description: "The matching translated word/phrase in the target language.",
                  },
                  sourcePhonetic: {
                    type: "STRING",
                    description: "The phonetic guide of the source word.",
                  },
                  targetPhonetic: {
                    type: "STRING",
                    description: "The phonetic guide of the target word.",
                  },
                  partOfSpeech: {
                    type: "STRING",
                    description: "The grammatical part of speech relative to its function.",
                  },
                  meaning: {
                    type: "STRING",
                    description: "The clear bilingual meaning of this word.",
                  },
                },
                required: ["source", "target", "sourcePhonetic", "targetPhonetic", "partOfSpeech", "meaning"],
              },
            },
            examples: {
              type: "ARRAY",
              description: "Bilingual example sentences showing usage.",
              items: {
                type: "OBJECT",
                properties: {
                  source: {
                    type: "STRING",
                    description: "Example sentence in the source language.",
                  },
                  target: {
                    type: "STRING",
                    description: "Equivalent example sentence in the target language.",
                  },
                  sourcePhonetic: {
                    type: "STRING",
                    description: "Phonetic guide for the source example.",
                  },
                  targetPhonetic: {
                    type: "STRING",
                    description: "Phonetic guide for the target example.",
                  },
                },
                required: ["source", "target", "sourcePhonetic", "targetPhonetic"],
              },
            },
            speakingTips: {
              type: "STRING",
              description: "Helpful speaking hints, cultural context, differences in formality levels, or polite ending indicators (like 'khrap'/'kha').",
            },
          },
          required: ["translation", "phonetic", "words", "examples", "speakingTips"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    return res.json(data);
  } catch (error: any) {
    console.error("Translation error during Gemini generation:", error);
    return res.status(500).json({
      error: "AI 翻译服务在生成结果时遇到了问题。错误详情: " + error.message,
      details: error.message,
    });
  }
});

// App configuration & server startup
async function startServer() {
  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server executing successfully on port ${PORT}`);
  });
}

startServer();
