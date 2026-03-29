# Zero 2076 Bot for macOS

This project runs on both Apple Silicon and Intel Macs.

## 1. Install Node.js

Use Homebrew:

```bash
brew install node
```

Check that it worked:

```bash
node -v
npm -v
```

## 2. Open the project folder

```bash
cd ~/zero2076
```

If your folder is somewhere else, replace the path with your real one.

## 3. Install dependencies

```bash
npm install
```

## 4. Create the environment file

Create a file named `.env` in the project root:

```bash
touch .env
```

Open it and add:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

## 5. Start the bot

```bash
npm start
```

If startup succeeds, you should see:

```bash
Zero bot started with model: ...
```

## 6. Telegram commands

- `/start` resets the conversation and shows the intro
- `/clear` clears memory for the current chat

## Notes

- The bot reads `.env` first, then falls back to `zero2076.env`.
- The character config is stored in `characters/zero.character.json`.
- Replies are instructed to default to Simplified Chinese.
