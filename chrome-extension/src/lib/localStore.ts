import { RevisionLog, StudyCategory, VideoProject, VideoStatus } from '../types';

// The extension has no account or remote database. These records live only in
// this Chrome profile under the extension's own localStorage origin.
const VIDEOS_KEY = 'rewise-videos';
const CATEGORIES_KEY = 'rewise-categories';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value), storageArea: localStorage }));
}

function videos() {
  return read<VideoProject[]>(VIDEOS_KEY, []).sort((a, b) => a.orderIndex - b.orderIndex);
}

function categories() {
  return read<StudyCategory[]>(CATEGORIES_KEY, []).sort((a, b) => a.orderIndex - b.orderIndex);
}

function saveVideos(items: VideoProject[]) {
  write(VIDEOS_KEY, items);
}

function saveCategories(items: StudyCategory[]) {
  write(CATEGORIES_KEY, items);
}

function subscribe<T>(key: string, load: () => T, callback: (items: T) => void) {
  callback(load());
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) callback(load());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function subscribeToVideos(callback: (items: VideoProject[]) => void) {
  return subscribe(VIDEOS_KEY, videos, callback);
}

export function subscribeToCategories(callback: (items: StudyCategory[]) => void) {
  return subscribe(CATEGORIES_KEY, categories, callback);
}

export async function addStudyCategory(name: string, color: string, orderIndex: number, keywords: string[] = []) {
  const now = new Date().toISOString();
  const category: StudyCategory = { id: makeId('category'), name, color, keywords, orderIndex, createdAt: now, updatedAt: now };
  saveCategories([...categories(), category]);
  return category.id;
}

export async function updateStudyCategory(categoryId: string, updates: Partial<StudyCategory>) {
  const now = new Date().toISOString();
  saveCategories(categories().map(category => category.id === categoryId ? { ...category, ...updates, updatedAt: now } : category));
}

export async function deleteStudyCategory(categoryId: string) {
  saveCategories(categories().filter(category => category.id !== categoryId));
}

export async function updateCategoryOrders(items: StudyCategory[]) {
  const now = new Date().toISOString();
  saveCategories(items.filter(category => !category.automatic).map((category, index) => ({ ...category, orderIndex: index, updatedAt: now })));
}

export async function addVideoProject(video: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const item: VideoProject = {
    ...video,
    id: makeId('topic'),
    revisionCount: Math.max(0, video.revisionCount ?? 0),
    targetRevisionCount: Math.max(1, video.targetRevisionCount || 3),
    totalTimeSeconds: Math.max(0, video.totalTimeSeconds || 0),
    status: video.status || 'not_started',
    tags: video.tags || [],
    orderIndex: video.orderIndex ?? Date.now(),
    revisionLogs: video.revisionLogs || [],
    createdAt: now,
    updatedAt: now,
  };
  saveVideos([...videos(), item]);
  return item.id;
}

export async function incrementVideoRevision(
  videoId: string,
  currentCount: number,
  logData?: Omit<RevisionLog, 'id' | 'revisionNumber' | 'timestamp'>,
  existingLogs: RevisionLog[] = [],
  addedDurationSeconds = 0,
) {
  const nextNumber = currentCount + 1;
  const now = new Date().toISOString();
  const durationSeconds = logData?.durationSeconds ?? addedDurationSeconds;
  const newLog: RevisionLog = {
    id: makeId(`rev-${nextNumber}`),
    revisionNumber: nextNumber,
    reason: logData?.reason || 'General Revision Round',
    notes: logData?.notes || '',
    durationSeconds,
    timestamp: now,
  };
  saveVideos(videos().map(video => video.id === videoId ? {
    ...video,
    revisionCount: nextNumber,
    revisionLogs: [...existingLogs, newLog],
    totalTimeSeconds: (video.totalTimeSeconds || 0) + durationSeconds,
    status: currentCount === 0 ? 'in_progress' as VideoStatus : video.status,
    updatedAt: now,
  } : video));
  return nextNumber;
}

export async function updateVideoProject(videoId: string, updates: Partial<VideoProject>) {
  const now = new Date().toISOString();
  saveVideos(videos().map(video => video.id === videoId ? { ...video, ...updates, updatedAt: now } : video));
}

export async function deleteVideoProject(videoId: string) {
  saveVideos(videos().filter(video => video.id !== videoId));
}

export async function deleteRevisionLog(videoId: string, logId: string, currentLogs: RevisionLog[]) {
  const updatedLogs = currentLogs.filter(log => log.id !== logId);
  await updateVideoProject(videoId, { revisionLogs: updatedLogs, revisionCount: updatedLogs.length });
}

export async function updateVideoOrders(items: VideoProject[]) {
  const now = new Date().toISOString();
  saveVideos(items.map((video, index) => ({ ...video, orderIndex: index, updatedAt: now })));
}
