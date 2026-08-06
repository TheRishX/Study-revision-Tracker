import { VideoProject } from '../types';

export const SAMPLE_VIDEOS: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Calculus - Integration by Parts & Definite Integrals 📐",
    subject: "Mathematics",
    revisionCount: 0,
    targetRevisionCount: 5,
    totalTimeSeconds: 0,
    status: "not_started",
    tags: ["Math", "Calculus", "MIT OCW"],
    deadline: "2026-08-20",
    notes: "Focus on trigonometric substitution and LIATE rule for selecting u and dv.",
    orderIndex: 0,
    revisionLogs: []
  },
  {
    title: "System Design - Distributed Caching & Redis Architecture 💻",
    subject: "Computer Science",
    revisionCount: 0,
    targetRevisionCount: 5,
    totalTimeSeconds: 0,
    status: "not_started",
    tags: ["System Design", "CS", "Backend"],
    deadline: "2026-08-15",
    notes: "Cache invalidation strategies: write-through, write-around, cache-aside. Eviction policies: LRU vs LFU.",
    orderIndex: 1,
    revisionLogs: []
  },
  {
    title: "Organic Chemistry - Sn1 vs Sn2 Reaction Mechanisms 🧪",
    subject: "Chemistry",
    revisionCount: 0,
    targetRevisionCount: 4,
    totalTimeSeconds: 0,
    status: "not_started",
    tags: ["Chemistry", "Organic", "Pre-Med"],
    deadline: "2026-08-25",
    notes: "Remember: Sn2 requires strong nucleophile and polar aprotic solvent, inversion of stereochemistry.",
    orderIndex: 2,
    revisionLogs: []
  },
  {
    title: "Data Structures - Graph Shortest Path (Dijkstra & A* Search) 🌳",
    subject: "Computer Science",
    revisionCount: 0,
    targetRevisionCount: 5,
    totalTimeSeconds: 0,
    status: "not_started",
    tags: ["Algorithms", "Data Structures", "LeetCode"],
    deadline: "2026-08-18",
    notes: "Priority Queue implementation yields O((V + E) log V) time complexity.",
    orderIndex: 3,
    revisionLogs: []
  }
];
