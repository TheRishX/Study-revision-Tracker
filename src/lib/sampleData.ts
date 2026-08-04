import { VideoProject } from '../types';

export const SAMPLE_VIDEOS: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Calculus - Integration by Parts & Definite Integrals 📐",
    subject: "Mathematics",
    revisionCount: 3,
    targetRevisionCount: 5,
    totalTimeSeconds: 5400,
    status: "in_progress",
    tags: ["Math", "Calculus", "MIT OCW"],
    deadline: "2026-08-20",
    notes: "Focus on trigonometric substitution and LIATE rule for selecting u and dv.",
    orderIndex: 0,
    revisionLogs: [
      {
        id: "log-1",
        revisionNumber: 1,
        reason: "First Watch 📺",
        notes: "Watched full 45-min lecture and wrote down key formulas.",
        durationSeconds: 2700,
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: "log-2",
        revisionNumber: 2,
        reason: "Practice Problems 📝",
        notes: "Solved 5 textbook integral problems using integration by parts.",
        durationSeconds: 1500,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "log-3",
        revisionNumber: 3,
        reason: "Quick Recap ⚡",
        notes: "Active recall flashcards for integration rules.",
        durationSeconds: 1200,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },
  {
    title: "System Design - Distributed Caching & Redis Architecture 💻",
    subject: "Computer Science",
    revisionCount: 5,
    targetRevisionCount: 5,
    totalTimeSeconds: 7200,
    status: "mastered",
    tags: ["System Design", "CS", "Backend"],
    deadline: "2026-08-15",
    notes: "Cache invalidation strategies: write-through, write-around, cache-aside. Eviction policies: LRU vs LFU.",
    orderIndex: 1,
    revisionLogs: [
      {
        id: "log-4",
        revisionNumber: 1,
        reason: "First Watch 📺",
        notes: "High level overview of Redis clusters and replication.",
        durationSeconds: 2400,
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString()
      },
      {
        id: "log-5",
        revisionNumber: 3,
        reason: "Formula & Concept Review 🧠",
        notes: "Drew system architecture diagram on whiteboard from memory.",
        durationSeconds: 2400,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: "log-6",
        revisionNumber: 5,
        reason: "Active Recall & Test 🎯",
        notes: "Self-tested on cache Stampede and Redis Sentinel failover. 100% accuracy!",
        durationSeconds: 2400,
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    title: "Organic Chemistry - Sn1 vs Sn2 Reaction Mechanisms 🧪",
    subject: "Chemistry",
    revisionCount: 2,
    targetRevisionCount: 4,
    totalTimeSeconds: 3600,
    status: "revision_due",
    tags: ["Chemistry", "Organic", "Pre-Med"],
    deadline: "2026-08-25",
    notes: "Remember: Sn2 requires strong nucleophile and polar aprotic solvent, inversion of stereochemistry.",
    orderIndex: 2,
    revisionLogs: [
      {
        id: "log-7",
        revisionNumber: 1,
        reason: "First Watch 📺",
        notes: "Watched Khan Academy series on substitution reactions.",
        durationSeconds: 2100,
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: "log-8",
        revisionNumber: 2,
        reason: "Formula & Concept Review 🧠",
        notes: "Reviewed carbocation stability order.",
        durationSeconds: 1500,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ]
  },
  {
    title: "Data Structures - Graph Shortest Path (Dijkstra & A* Search) 🌳",
    subject: "Computer Science",
    revisionCount: 4,
    targetRevisionCount: 5,
    totalTimeSeconds: 4800,
    status: "in_progress",
    tags: ["Algorithms", "Data Structures", "LeetCode"],
    deadline: "2026-08-18",
    notes: "Priority Queue implementation yields O((V + E) log V) time complexity.",
    orderIndex: 3,
    revisionLogs: [
      {
        id: "log-9",
        revisionNumber: 1,
        reason: "First Watch 📺",
        notes: "Watched Abdul Bari lecture on Greedy Algorithms.",
        durationSeconds: 2700,
        timestamp: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        id: "log-10",
        revisionNumber: 4,
        reason: "Practice Problems 📝",
        notes: "Hand-traced graph with 6 nodes on paper.",
        durationSeconds: 2100,
        timestamp: new Date().toISOString()
      }
    ]
  }
];

