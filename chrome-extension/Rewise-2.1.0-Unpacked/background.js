const SETTINGS_KEY = 'revisionReminderSettings';
const GOAL_KEY = 'dailyRevisionGoal';
const GOAL_ALARM = 'rewise-goal-prompt';
const CHECK_IN_ALARM = 'rewise-check-in';

const getState = keys => new Promise(resolve => chrome.storage.local.get(keys, resolve));

function nextTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

function isQuiet(settings) {
  const [hours, minutes] = settings.quietTime.split(':').map(Number);
  const quietAt = new Date();
  quietAt.setHours(hours, minutes, 0, 0);
  return new Date() >= quietAt;
}

async function schedule(settings) {
  await chrome.alarms.clear(GOAL_ALARM);
  await chrome.alarms.clear(CHECK_IN_ALARM);
  if (!settings?.enabled) return;

  chrome.alarms.create(GOAL_ALARM, { when: nextTime(settings.morningTime), periodInMinutes: 1440 });
  chrome.alarms.create(CHECK_IN_ALARM, { delayInMinutes: settings.checkInMinutes, periodInMinutes: settings.checkInMinutes });
}

async function notify(alarmName) {
  const { [SETTINGS_KEY]: settings, [GOAL_KEY]: goal } = await getState([SETTINGS_KEY, GOAL_KEY]);
  if (!settings?.enabled || isQuiet(settings) || goal?.completed) return;

  const needsGoal = !goal?.intent;
  const title = needsGoal ? 'Set today’s revision goal' : 'Revision check-in';
  const message = needsGoal
    ? 'What is one topic you will revise today?'
    : `How is “${goal.intent}” going? Take a focused next step.`;
  chrome.notifications.create(`${alarmName}-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 1,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { [SETTINGS_KEY]: settings } = await getState([SETTINGS_KEY]);
  await schedule(settings);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === 'SAVE_REMINDER_SETTINGS') {
      await chrome.storage.local.set({ [SETTINGS_KEY]: message.settings });
      await schedule(message.settings);
    }
    if (message?.type === 'SYNC_DAILY_GOAL') {
      await chrome.storage.local.set({ [GOAL_KEY]: message.goal });
    }
    sendResponse({ ok: true });
  })().catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.alarms.onAlarm.addListener(alarm => void notify(alarm.name));

chrome.notifications.onClicked.addListener(() => chrome.tabs.create({ url: 'chrome://newtab/' }));
