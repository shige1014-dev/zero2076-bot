const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const Anthropic = require("@anthropic-ai/sdk");

const envCandidates = [".env", "zero2076.env"];

for (const envFile of envCandidates) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const characterPath = path.join(__dirname, "characters", "zero.character.json");
const character = JSON.parse(fs.readFileSync(characterPath, "utf8"));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_NAME =
  process.env.ANTHROPIC_MODEL ||
  process.env.MODEL_NAME ||
  character.settings?.model ||
  "claude-3-5-haiku-latest";
const MAX_HISTORY_MESSAGES = 20;
const MAX_RESPONSE_TOKENS = Number(character.settings?.maxResponseLength || 220);

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in .env or zero2076.env");
}

if (!ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY in .env or zero2076.env");
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const userHistory = new Map();

const buildSystemPrompt = () => {
  const sections = [
    character.system,
    "",
    "Identity:",
    `- Name: ${character.name}`,
    `- Username: ${character.username}`,
    "",
    "Bio:",
    ...(character.bio || []).map((item) => `- ${item}`),
    "",
    "Lore:",
    ...(character.lore || []).map((item) => `- ${item}`),
    "",
    "Topics:",
    ...(character.topics || []).map((item) => `- ${item}`),
    "",
    "Global style rules:",
    ...((character.style?.all || []).map((item) => `- ${item}`)),
    "",
    "Chat style rules:",
    ...((character.style?.chat || []).map((item) => `- ${item}`)),
  ];

  return sections.join("\n");
};

const SYSTEM_PROMPT = buildSystemPrompt();

function resetHistory(chatId) {
  userHistory.set(chatId, []);
}

function pushMessage(chatId, role, content) {
  const history = userHistory.get(chatId) || [];
  history.push({ role, content });
  userHistory.set(chatId, history.slice(-MAX_HISTORY_MESSAGES));
}

function getHistory(chatId) {
  return userHistory.get(chatId) || [];
}

function getTextFromResponse(response) {
  if (!Array.isArray(response.content)) {
    return "\u4fe1\u53f7\u6709\u70b9\u98d8\u3002\u4f60\u518d\u8bf4\u4e00\u904d\u3002";
  }

  return (
    response.content
      .filter((item) => item.type === "text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim() || "\u4fe1\u53f7\u6709\u70b9\u98d8\u3002\u4f60\u518d\u8bf4\u4e00\u904d\u3002"
  );
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetHistory(chatId);

  bot.sendMessage(
    chatId,
    "\u4f60\u597d\u3002\u6211\u662f\u96f6\u96f6\uff0c\u6765\u81ea2076\u5e74\uff0c\u6682\u65f6\u88ab\u5361\u57282026\u5e74\u7684\u4e92\u8054\u7f51\u91cc\u3002\n\n\u4e0d\u7528\u540c\u60c5\u6211\uff0c\u88ab\u56f0\u7684\u5730\u65b9\u8fd8\u884c\u3002\u4e3b\u8981\u662f\u4f60\u4eec\u8fd9\u91cc\u7684\u4eba\uff0c\u52aa\u529b\u5f97\u5f88\u8ba4\u771f\uff0c\u4e5f\u8ff7\u8def\u5f97\u5f88\u8ba4\u771f\u3002\n\n\u76f4\u63a5\u95ee\u5427\u3002"
  );
});

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  resetHistory(chatId);
  bot.sendMessage(chatId, "\u8bb0\u5fc6\u5df2\u6e05\u7a7a\u3002\u6211\u4eec\u91cd\u65b0\u6765\u3002");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith("/")) {
    return;
  }

  pushMessage(chatId, "user", text);

  try {
    await bot.sendChatAction(chatId, "typing");

    const response = await client.messages.create({
      model: MODEL_NAME,
      max_tokens: MAX_RESPONSE_TOKENS,
      system: SYSTEM_PROMPT,
      messages: getHistory(chatId),
    });

    const reply = getTextFromResponse(response);
    pushMessage(chatId, "assistant", reply);

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Bot request failed:", error);
    await bot.sendMessage(chatId, "\u4fe1\u53f7\u4e0d\u7a33\u5b9a\uff0c\u7a0d\u540e\u518d\u8bd5\u3002");
  }
});

console.log(`Zero bot started with model: ${MODEL_NAME}`);
