import TelegramBot from 'node-telegram-bot-api';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const pb = new PocketBase(process.env.POCKETBASE_URL);

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// PB Auth
const initPB = async () => {
  try {
    if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
    }
  } catch (err) {
    console.error('PB Bot Auth Failed:', err);
  }
};
initPB();

console.log('SoulScript Telegram Bot is running...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const response = `Welcome to SoulScript! ✨

To start receiving beautiful quote cards, please enter your 6-digit verification code from the SoulScript app here.`;

  bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.on('message', async (msg) => {
  if (!msg.text) return;
  const text = msg.text.trim();
  const chatId = msg.chat.id;
  const username = msg.from?.username ? `@${msg.from.username}` : null;

  // Check if it's a 6-digit code
  if (/^\d{6}$/.test(text)) {
    if (!username) {
      await bot.sendMessage(chatId, "⚠️ Please set a Telegram username in your profile settings so we can verify your account.");
      return;
    }

    try {
      // Find unverified record for this code and username
      // We check for username matching (including @ prefix)
      const record = await pb.collection('verifications').getFirstListItem(
        `code = "${text}" && username = "${username}" && verified = false`,
        { sort: '-created' }
      );

      const now = new Date();
      const expiresAt = new Date(record.expiresAt);

      if (now < expiresAt) {
        // Mark as verified
        await pb.collection('verifications').update(record.id, {
          verified: true,
          chatId: chatId.toString() // Link the chat ID
        });

        // Also update sub in subscriptions if it exists there
        try {
          const sub = await pb.collection('subscriptions').getFirstListItem(`username = "${username}"`);
          await pb.collection('subscriptions').update(sub.id, {
            chatId: chatId.toString(),
            verified: true
          });
        } catch (subErr) {
          // Subscription might not be in DB yet, that's okay
        }

        await bot.sendMessage(chatId, "✅ You're verified! SoulScript will now deliver your daily quote cards here.");
      } else {
        await bot.sendMessage(chatId, "❌ This code has expired. Please generate a new one in the SoulScript app.");
      }
    } catch (err) {
      await bot.sendMessage(chatId, "❌ Invalid or expired code. Please generate a new code in the SoulScript app.");
    }
  }
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Delivery paused. Visit the SoulScript app to manage or cancel your subscription.');
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Type /start to get your Chat ID.');
});
