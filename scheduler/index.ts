/* POCKETBASE COLLECTIONS NEEDED

Collection: verifications
Fields:
- username (text)
- email (text)  
- code (text)
- channel (text)
- expiresAt (datetime)
- verified (boolean)

Collection: subscriptions
Fields:
- userId (text)
- channel (text)
- email (text)
- chatId (text)
- username (text)
- category (text)
- mood (text)
- count (number)
- frequency (text)
- timeOfDay (text)
- timezone (text)
- paused (boolean)
- lastSentAt (datetime)
- createdAt (datetime)

*/

import PocketBase from 'pocketbase';
import { Resend } from 'resend';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!);

async function init() {
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  
  console.log('Scheduler initialized focusing on PocketBase...');
  checkAndDeliver();
  setInterval(checkAndDeliver, 1000 * 60 * 60); // Every hour
}

async function checkAndDeliver() {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Logic to determine period
  let timeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning';
  if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
  else if (currentHour >= 18 || currentHour < 6) timeOfDay = 'evening';

  console.log(`Checking for ${timeOfDay} deliveries...`);

  try {
    const subscriptions = await pb.collection('subscriptions').getFullList({
      filter: `paused = false && timeOfDay = "${timeOfDay}"`,
    });

    for (const sub of subscriptions) {
      // Basic check for frequency: simple daily/weekly/monthly check based on lastSentAt
      const lastSent = sub.lastSentAt ? new Date(sub.lastSentAt) : new Date(0);
      const diffDays = (now.getTime() - lastSent.getTime()) / (1000 * 3600 * 24);

      let shouldSend = false;
      if (sub.frequency === 'daily' && diffDays >= 0.8) shouldSend = true;
      if (sub.frequency === 'weekly' && diffDays >= 6.8) shouldSend = true;
      if (sub.frequency === 'monthly' && diffDays >= 28) shouldSend = true;

      if (shouldSend) {
        await deliverQuotes(sub);
        await pb.collection('subscriptions').update(sub.id, {
          lastSentAt: now.toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error checking subscriptions:', err);
  }
}

async function deliverQuotes(sub: any) {
  console.log(`Delivering to ${sub.channel}: ${sub.email || sub.chatId}`);
  
  try {
    // Fetch quotes from quotable
    const categoryQuery = sub.category !== 'All' ? `&tags=${sub.category.toLowerCase()}` : '';
    const response = await axios.get(`https://api.quotable.io/quotes/random?limit=${sub.count}${categoryQuery}`);
    const quotes = response.data;

    if (sub.channel === 'email') {
      await sendEmail(sub, quotes);
    } else {
      await sendTelegram(sub, quotes);
    }
  } catch (err) {
    console.error('Delivery failed:', err);
  }
}

async function sendEmail(sub: any, quotes: any[]) {
  const html = `
    <div style="font-family: 'Playfair Display', serif; background-color: #030303; color: #ffffff; padding: 40px; text-align: center;">
      <h1 style="color: #8b5cf6; margin-bottom: 40px;">SoulScript</h1>
      <p style="color: #9ca3af; margin-bottom: 60px;">Your ${sub.timeOfDay} delivery of inspiration.</p>
      
      ${quotes.map(q => `
        <div style="margin-bottom: 40px; border-radius: 20px; overflow: hidden; background: #111; border: 1px solid #333;">
          <img src="https://loremflickr.com/800/600/nature,meditation?lock=${Math.random()}" style="width: 100%; height: auto;" />
          <div style="padding: 30px;">
            <p style="font-size: 24px; font-style: italic; margin-bottom: 20px;">"${q.content}"</p>
            <p style="color: #8b5cf6; font-weight: bold;">— ${q.author}</p>
            <span style="display: inline-block; padding: 4px 12px; background: #8b5cf633; color: #8b5cf6; border-radius: 99px; font-size: 12px; margin-top: 10px;">${q.tags.join(', ')}</span>
          </div>
        </div>
      `).join('')}
      
      <div style="margin-top: 60px; border-top: 1px solid #333; padding-top: 40px; color: #444; font-size: 12px;">
        <p>Sent with love from SoulScript. Visit the app to manage your subscription.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'SoulScript <quotes@soulscript.io>',
    to: sub.email,
    subject: `Daily ${sub.category} Inspiration`,
    html: html
  });
}

async function sendTelegram(sub: any, quotes: any[]) {
  await bot.sendMessage(sub.chatId, `✨ *SoulScript Delivery* ✨\nHere are your ${quotes.length} quotes for today:`, { parse_mode: 'Markdown' });

  // Send images with captions in chunks of 10
  for (let i = 0; i < quotes.length; i += 10) {
    const chunk = quotes.slice(i, i + 10);
    const media: any[] = chunk.map(q => ({
      type: 'photo',
      media: `https://loremflickr.com/800/600/nature,meditation?lock=${Math.random()}`,
      caption: `"${q.content}"\n\n— ${q.author} | ${q.tags.join(', ')}`
    }));

    await bot.sendMediaGroup(sub.chatId, media);
  }
}

init();
