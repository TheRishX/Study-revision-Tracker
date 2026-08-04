import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

type ReminderClient = {
  subscription: webpush.PushSubscription;
  settings: {
    enabled: boolean;
    morningTime: string;
    repeatMinutes: number;
    checkInMinutes: number;
    quietTime: string;
    timezone: string;
  };
  goal: null | { dateStr: string; title?: string; status?: string; completed?: boolean };
  lastGoalPromptAt?: number;
  lastCheckInAt?: number;
};

const reminderClients = new Map<string, ReminderClient>();

function dateAndMinutes(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const generatedVapid = webpush.generateVAPIDKeys();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || generatedVapid.publicKey;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || generatedVapid.privateKey;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:reminders@rewise.app', vapidPublicKey, vapidPrivateKey);

  app.get('/api/notifications/public-key', (_req, res) => res.json({ publicKey: vapidPublicKey }));

  app.post('/api/notifications/subscribe', (req, res) => {
    const { subscription, settings } = req.body || {};
    if (!subscription?.endpoint || !settings) return res.status(400).json({ error: 'Invalid subscription' });
    reminderClients.set(subscription.endpoint, { subscription, settings: { ...settings, enabled: true }, goal: null });
    res.json({ ok: true });
  });

  app.post('/api/notifications/goal', (req, res) => {
    const client = reminderClients.get(req.body?.endpoint);
    if (client) {
      client.goal = req.body.goal || null;
      client.lastGoalPromptAt = undefined;
      client.lastCheckInAt = Date.now();
    }
    res.json({ ok: true });
  });

  app.post('/api/notifications/unsubscribe', (req, res) => {
    reminderClients.delete(req.body?.endpoint);
    res.json({ ok: true });
  });

  const reminderTimer = setInterval(async () => {
    const now = Date.now();
    for (const [endpoint, client] of reminderClients) {
      if (!client.settings.enabled) continue;
      try {
        const local = dateAndMinutes(client.settings.timezone);
        const morning = toMinutes(client.settings.morningTime);
        const quiet = toMinutes(client.settings.quietTime);
        if (local.minutes < morning || local.minutes >= quiet) continue;
        const hasGoalToday = client.goal?.dateStr === local.date;

        if (!hasGoalToday) {
          const repeatMs = client.settings.repeatMinutes * 60_000;
          if (!client.lastGoalPromptAt || now - client.lastGoalPromptAt >= repeatMs) {
            await webpush.sendNotification(client.subscription, JSON.stringify({
              title: 'What will you learn today?',
              body: 'Choose one clear outcome before the day chooses for you.',
              tag: `morning-goal-${local.date}`,
              url: '/',
            }));
            client.lastGoalPromptAt = now;
          }
        } else if (!client.goal?.completed) {
          const checkInMs = client.settings.checkInMinutes * 60_000;
          if (!client.lastCheckInAt || now - client.lastCheckInAt >= checkInMs) {
            await webpush.sendNotification(client.subscription, JSON.stringify({
              title: client.goal?.status === 'learning' ? 'Still learning?' : 'Ready to make progress?',
              body: client.goal?.title ? `Today: ${client.goal.title}` : 'Open your goal and update your status.',
              tag: `progress-check-${local.date}`,
              url: '/',
            }));
            client.lastCheckInAt = now;
          }
        }
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) reminderClients.delete(endpoint);
        else console.warn('Reminder delivery failed:', error?.message || error);
      }
    }
  }, 30_000);
  reminderTimer.unref();

  // Initialize Gemini AI Client lazily or safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini Chatbot Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, currentProjects } = req.body;
      const ai = getAiClient();

      const systemInstruction = `
You are "Study Tutor", an encouraging, highly knowledgeable AI Study & Revision Assistant inside the "Study Video Revision Tracker" web app.
Your role:
- Help students revise study videos, lectures, course topics, and exam material repeatedly.
- Provide active recall quiz questions, Feynman technique explanations, spaced repetition schedules, and memory retention strategies.
- Context: The student currently has study topics: ${JSON.stringify(currentProjects || [])}.
- Keep answers concise, highly motivating, structured with bullet points or short paragraphs.
`;

      const contents = (messages || []).map((m: { sender: string; text: string }) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      // Add default user query if none
      if (!contents.length) {
        contents.push({ role: "user", parts: [{ text: "Hello! How can you help me manage my video revisions?" }] });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I'm right here to help you crush your video revisions! What's on your mind?";
      res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to contact Gemini AI assistant.",
        text: "I couldn't reach the AI server right now, but here's a quick tip: Always present 2 distinct options to clients to prevent endless open-ended revision cycles! 🎬"
      });
    }
  });

  // AI Client Email / Message Response Generator
  app.post("/api/client-response-assistant", async (req, res) => {
    try {
      const { videoTitle, revisionCount, clientName, issueType, tone } = req.body;
      const ai = getAiClient();

      const prompt = `
Create a professional yet friendly client email/message for a video project.
Project Title: "${videoTitle}"
Client Name: "${clientName || "Valued Client"}"
Current Revision Count: ${revisionCount}
Issue / Context: ${issueType || "Gentle reminder about revision policy or asking for final approval"}
Desired Tone: ${tone || "Polite & Firm"}

Guidelines:
- Keep it concise, friendly, and easy to copy.
- Clear call to action (asking for timestamped approval or confirming additional scope fee if needed).
- Provide a clear subject line and message body.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.6,
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Client response assistant error:", error);
      res.status(500).json({
        error: "Failed to generate AI client response",
        result: `Subject: Update on ${req.body.videoTitle || 'Video Cut'} - Revision #${req.body.revisionCount || 1}\n\nHi ${req.body.clientName || 'there'},\n\nHope you're having a great day! I've incorporated the latest adjustments. Please review the cut and let me know if we're all clear for final approval! 🎉\n\nBest regards,`
      });
    }
  });

  // Vite Middleware for Development vs Production Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
