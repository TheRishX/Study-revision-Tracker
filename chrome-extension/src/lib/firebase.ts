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
import { VideoProject, RevisionLog, VideoStatus, StudyCategory } from '../types';
import * as localStore from './localStore';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore database instance with configured database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

const VIDEOS_COLLECTION = 'videos';
const CATEGORIES_COLLECTION = 'categories';

// Subscribe to videos list in real-time
export function subscribeToVideos(callback: (videos: VideoProject[]) => void) {
  let unsubscribeLocal = () => {};
  try {
    const q = query(collection(db, VIDEOS_COLLECTION));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      localStore.replaceLocalVideos(items);
      callback(items);
    }, (error) => {
      console.warn('Firestore subscription unavailable; using the extension cache:', error);
      unsubscribeLocal();
      unsubscribeLocal = localStore.subscribeToVideos(callback);
    });
    return () => { unsubscribe(); unsubscribeLocal(); };
  } catch (err) {
    console.error('Failed to subscribe to Firestore videos:', err);
    return localStore.subscribeToVideos(callback);
  }
}

export function subscribeToCategories(callback: (categories: StudyCategory[]) => void) {
  let unsubscribeLocal = () => {};
  const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION));
  const unsubscribe = onSnapshot(categoriesQuery, snapshot => {
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
    const sorted = categories.sort((a, b) => a.orderIndex - b.orderIndex);
    localStore.replaceLocalCategories(sorted);
    callback(sorted);
  }, error => {
    console.warn('Category subscription unavailable; using the extension cache:', error);
    unsubscribeLocal();
    unsubscribeLocal = localStore.subscribeToCategories(callback);
  });
  return () => { unsubscribe(); unsubscribeLocal(); };
}

export async function addStudyCategory(name: string, color: string, orderIndex: number, keywords: string[] = []) {
  try {
    const now = new Date().toISOString();
    const categoryDoc = await addDoc(collection(db, CATEGORIES_COLLECTION), { name, color, keywords, orderIndex, createdAt: now, updatedAt: now });
    return categoryDoc.id;
  } catch (error) {
    console.warn('Saving category to the extension cache:', error);
    return localStore.addStudyCategory(name, color, orderIndex, keywords);
  }
}

export async function updateStudyCategory(categoryId: string, updates: Partial<StudyCategory>) {
  try {
    await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn('Updating category in the extension cache:', error);
    await localStore.updateStudyCategory(categoryId, updates);
  }
}

export async function deleteStudyCategory(categoryId: string) {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
  } catch (error) {
    console.warn('Deleting category from the extension cache:', error);
    await localStore.deleteStudyCategory(categoryId);
  }
}

export async function updateCategoryOrders(categories: StudyCategory[]) {
  try {
    await Promise.all(categories.filter(category => !category.automatic).map((category, index) =>
      updateDoc(doc(db, CATEGORIES_COLLECTION, category.id), { orderIndex: index, updatedAt: new Date().toISOString() })
    ));
  } catch (error) {
    console.warn('Reordering categories in the extension cache:', error);
    await localStore.updateCategoryOrders(categories);
  }
}

// Add a new video project
export async function addVideoProject(video: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
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
  } catch (error) {
    console.warn('Saving topic to the extension cache:', error);
    return localStore.addVideoProject(video);
  }
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

  try {
    await updateDoc(videoRef, updateData);
    return nextNumber;
  } catch (error) {
    console.warn('Saving revision to the extension cache:', error);
    return localStore.incrementVideoRevision(videoId, currentCount, logData, existingLogs, addedDurationSeconds);
  }
}

// Update existing video details
export async function updateVideoProject(videoId: string, updates: Partial<VideoProject>) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  try {
    await updateDoc(videoRef, payload);
  } catch (error) {
    console.warn('Updating topic in the extension cache:', error);
    await localStore.updateVideoProject(videoId, updates);
  }
}

// Delete video card from Firestore
export async function deleteVideoProject(videoId: string) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  try {
    await deleteDoc(videoRef);
  } catch (error) {
    console.warn('Deleting topic from the extension cache:', error);
    await localStore.deleteVideoProject(videoId);
  }
}

// Delete a specific revision log from a video project
export async function deleteRevisionLog(videoId: string, logId: string, currentLogs: RevisionLog[]) {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const updatedLogs = currentLogs.filter(l => l.id !== logId);
  const newCount = Math.max(0, updatedLogs.length);
  try {
    await updateDoc(videoRef, {
      revisionLogs: updatedLogs,
      revisionCount: newCount,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Updating revision logs in the extension cache:', error);
    await localStore.deleteRevisionLog(videoId, logId, currentLogs);
  }
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
    console.warn('Reordering topics in the extension cache:', err);
    await localStore.updateVideoOrders(reorderedVideos);
  }
}
