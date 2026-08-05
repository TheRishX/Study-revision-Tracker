const DB_NAME = 'rewise-reminders';
const STORE_NAME = 'alarm-sound';
const SOUND_KEY = 'selected';

type StoredSound = { name: string; type: string; blob: Blob };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local audio storage.'));
  });
}

async function readSound(): Promise<StoredSound | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(SOUND_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAlarmSound(file: File): Promise<string> {
  if (!file.type.startsWith('audio/')) throw new Error('Choose an audio file, such as MP3, WAV, or M4A.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose an audio file smaller than 12 MB.');
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({ name: file.name, type: file.type, blob: file }, SOUND_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  return file.name;
}

export async function removeAlarmSound(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(SOUND_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function playSelectedAlarmSound(): Promise<boolean> {
  const sound = await readSound();
  if (!sound) return false;
  const url = URL.createObjectURL(sound.blob);
  const audio = new Audio(url);
  audio.volume = 1;
  audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
  audio.addEventListener('error', () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
  return true;
}
