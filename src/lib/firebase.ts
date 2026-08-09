import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  increment,
  getDocs,
  setDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { VideoProject, RevisionLog, VideoStatus, StudyCategory, MainTopic, MainTopicCategory } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore database instance with configured database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

const VIDEOS_COLLECTION = 'videos';
const CATEGORIES_COLLECTION = 'categories';
const MAIN_TOPICS_COLLECTION = 'mainTopics';
const MAIN_TOPIC_CATEGORIES_COLLECTION = 'mainTopicCategories';

export function subscribeToMainTopicCategories(callback: (categories: MainTopicCategory[]) => void) {
  return onSnapshot(query(collection(db, MAIN_TOPIC_CATEGORIES_COLLECTION)), snapshot => {
    callback(snapshot.docs.map(categoryDoc => {
      const data = categoryDoc.data();
      return { id: categoryDoc.id, name: data.name || 'Untitled category', orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0, createdAt: data.createdAt || new Date().toISOString(), updatedAt: data.updatedAt || new Date().toISOString() } as MainTopicCategory;
    }).sort((a, b) => a.orderIndex - b.orderIndex));
  }, error => console.warn('Main topic category subscription failed:', error));
}

export async function addMainTopicCategory(name: string, orderIndex: number) {
  const now = new Date().toISOString();
  const reference = await addDoc(collection(db, MAIN_TOPIC_CATEGORIES_COLLECTION), { name, orderIndex, createdAt: now, updatedAt: now });
  return reference.id;
}

export async function updateMainTopicCategory(categoryId: string, name: string) {
  await updateDoc(doc(db, MAIN_TOPIC_CATEGORIES_COLLECTION, categoryId), { name, updatedAt: new Date().toISOString() });
}

export async function deleteMainTopicCategory(categoryId: string) {
  await deleteDoc(doc(db, MAIN_TOPIC_CATEGORIES_COLLECTION, categoryId));
}

export async function updateMainTopicCategoryOrder(categoryId: string, orderIndex: number) {
  await updateDoc(doc(db, MAIN_TOPIC_CATEGORIES_COLLECTION, categoryId), { orderIndex, updatedAt: new Date().toISOString() });
}

export function subscribeToMainTopics(callback: (topics: MainTopic[]) => void) {
  return onSnapshot(query(collection(db, MAIN_TOPICS_COLLECTION)), snapshot => {
    callback(snapshot.docs.map(topicDoc => {
      const data = topicDoc.data();
      return {
        id: topicDoc.id, name: data.name || 'Untitled topic', category: data.category || 'General', parentId: data.parentId || '',
        usedFor: data.usedFor || '', completed: Boolean(data.completed), orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0,
        createdAt: data.createdAt || new Date().toISOString(), updatedAt: data.updatedAt || new Date().toISOString(),
      } as MainTopic;
    }).sort((a, b) => a.orderIndex - b.orderIndex));
  }, error => console.warn('Main topic subscription failed:', error));
}

export async function addMainTopic(topic: Omit<MainTopic, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const reference = await addDoc(collection(db, MAIN_TOPICS_COLLECTION), { ...topic, createdAt: now, updatedAt: now });
  return reference.id;
}

export async function updateMainTopic(topicId: string, updates: Partial<MainTopic>) {
  await updateDoc(doc(db, MAIN_TOPICS_COLLECTION, topicId), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteMainTopic(topicId: string) {
  await deleteDoc(doc(db, MAIN_TOPICS_COLLECTION, topicId));
}

// Subscribe to videos list in real-time
export function subscribeToVideos(callback: (videos: VideoProject[]) => void) {
  try {
    const q = query(collection(db, VIDEOS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const items: VideoProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || 'Untitled Topic',
          subject: data.subject || '',
          categoryId: data.categoryId || '',
          categorySource: data.categorySource === 'manual' || (!data.categorySource && data.categoryId) ? 'manual' : 'smart',
          revisionCount: typeof data.revisionCount === 'number' ? Math.max(0, data.revisionCount) : 0,
          targetRevisionCount: typeof data.targetRevisionCount === 'number' ? data.targetRevisionCount : 3,
          totalTimeSeconds: typeof data.totalTimeSeconds === 'number' ? data.totalTimeSeconds : 0,
          status: (data.status as VideoStatus) || 'not_started',
          tags: Array.isArray(data.tags) ? data.tags : [],
          deadline: data.deadline || '',
          notes: data.notes || '',
          orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0,
          revisionLogs: Array.isArray(data.revisionLogs) ? data.revisionLogs : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort client side by orderIndex
      items.sort((a, b) => a.orderIndex - b.orderIndex);
      callback(items);
    }, (error) => {
      console.warn('Firestore subscription warning, fallback to local cache:', error);
    });
  } catch (err) {
    console.error('Failed to subscribe to Firestore videos:', err);
    return () => {};
  }
}

export function subscribeToCategories(callback: (categories: StudyCategory[]) => void) {
  const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION));
  return onSnapshot(categoriesQuery, snapshot => {
    const categories = snapshot.docs.map(categoryDoc => {
      const data = categoryDoc.data();
      return {
        id: categoryDoc.id,
        name: data.name || 'Untitled category',
        color: data.color || '#667a4f',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as StudyCategory;
    });
    callback(categories.sort((a, b) => a.orderIndex - b.orderIndex));
  }, error => console.warn('Category subscription failed:', error));
}

export async function addStudyCategory(name: string, color: string, orderIndex: number, keywords: string[] = []) {
  const now = new Date().toISOString();
  const categoryDoc = await addDoc(collection(db, CATEGORIES_COLLECTION), { name, color, keywords, orderIndex, createdAt: now, updatedAt: now });
  return categoryDoc.id;
}

export async function updateStudyCategory(categoryId: string, updates: Partial<StudyCategory>) {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteStudyCategory(categoryId: string) {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
}

export async function updateCategoryOrders(categories: StudyCategory[]) {
  await Promise.all(categories.filter(category => !category.automatic).map((category, index) =>
    updateDoc(doc(db, CATEGORIES_COLLECTION, category.id), { orderIndex: index, updatedAt: new Date().toISOString() })
  ));
}

// Add a new video project
export async function addVideoProject(video: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
    ...video,
    revisionCount: Math.max(0, video.revisionCount ?? 0),
    targetRevisionCount: Math.max(1, video.targetRevisionCount || 3),
    totalTimeSeconds: Math.max(0, video.totalTimeSeconds || 0),
    status: video.status || 'not_started',
    tags: video.tags || [],
    orderIndex: video.orderIndex ?? Date.now(),
    revisionLogs: video.revisionLogs || [],
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

// Increment revision count by 1 with optional log detail & session duration
export async function incrementVideoRevision(
  videoId: string, 
  currentCount: number, 
  logData?: Omit<RevisionLog, 'id' | 'revisionNumber' | 'timestamp'>,
  existingLogs: RevisionLog[] = [],
  addedDurationSeconds: number = 0
) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const nextNumber = currentCount + 1;
  const now = new Date().toISOString();

  const newLog: RevisionLog = {
    id: `rev-${nextNumber}-${Date.now()}`,
    revisionNumber: nextNumber,
    reason: logData?.reason || 'General Revision Round',
    notes: logData?.notes || '',
    durationSeconds: logData?.durationSeconds ?? addedDurationSeconds ?? 0,
    timestamp: now
  };

  const updatedLogs = [...existingLogs, newLog];

  const updateData: any = {
    revisionCount: increment(1),
    revisionLogs: updatedLogs,
    updatedAt: now
  };

  // Beginning the first revision moves a fresh topic into active learning.
  if (currentCount === 0) {
    updateData.status = 'in_progress';
  }

  if (addedDurationSeconds > 0 || logData?.durationSeconds) {
    const timeToAdd = logData?.durationSeconds || addedDurationSeconds;
    updateData.totalTimeSeconds = increment(timeToAdd);
  }

  await updateDoc(videoRef, updateData);

  return nextNumber;
}

// Update existing video details
export async function updateVideoProject(videoId: string, updates: Partial<VideoProject>) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(videoRef, payload);
}

// Delete video card from Firestore
export async function deleteVideoProject(videoId: string) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  await deleteDoc(videoRef);
}

// Delete a specific revision log from a video project
export async function deleteRevisionLog(videoId: string, logId: string, currentLogs: RevisionLog[]) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const updatedLogs = currentLogs.filter(l => l.id !== logId);
  const newCount = Math.max(0, updatedLogs.length);
  await updateDoc(videoRef, {
    revisionLogs: updatedLogs,
    revisionCount: newCount,
    updatedAt: new Date().toISOString()
  });
}

// Update order indexes after reordering/drag-and-drop
export async function updateVideoOrders(reorderedVideos: VideoProject[]) {
  try {
    const promises = reorderedVideos.map((v, idx) => {
      const videoRef = doc(db, VIDEOS_COLLECTION, v.id);
      return updateDoc(videoRef, { orderIndex: idx });
    });
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to batch update video order:', err);
  }
}
