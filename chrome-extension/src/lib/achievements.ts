import { Achievement, VideoProject } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_cut',
    title: 'First Study Topic! 📚',
    description: 'Add your very first study video topic to the tracker.',
    icon: '✨',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'revision_slayer',
    title: 'Memory Master 🧠',
    description: 'Log 10 total revision rounds across your study topics.',
    icon: '🔥',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'one_take_wonder',
    title: 'Quick Learner ⚡',
    description: 'Master a study topic in 2 or fewer revision rounds.',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'client_whisperer',
    title: 'Scholar 🎓',
    description: 'Get 3 study topics marked as Mastered.',
    icon: '🎉',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'scope_shield',
    title: 'Deep Diver 🌊',
    description: 'Complete 5 or more revision rounds on a challenging topic!',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'perfectionist',
    title: 'Unstoppable Scholar 🚀',
    description: 'Track 25 total revision rounds across all study topics.',
    icon: '👑',
    unlocked: false,
    progress: 0,
    maxProgress: 25
  }
];

export function calculateAchievements(videos: VideoProject[]): Achievement[] {
  const totalRevisions = videos.reduce((acc, v) => acc + (v.revisionCount || 0), 0);
  const totalVideos = videos.length;
  const approvedVideos = videos.filter(v => v.status === 'mastered');
  const hasOneTakeApproved = approvedVideos.some(v => v.revisionCount <= 2);
  const hasHighRevisionProject = videos.some(v => v.revisionCount >= 5);

  return INITIAL_ACHIEVEMENTS.map(ach => {
    let progress = 0;
    let unlocked = false;

    switch (ach.id) {
      case 'first_cut':
        progress = Math.min(totalVideos, 1);
        unlocked = totalVideos >= 1;
        break;
      case 'revision_slayer':
        progress = Math.min(totalRevisions, 10);
        unlocked = totalRevisions >= 10;
        break;
      case 'one_take_wonder':
        progress = hasOneTakeApproved ? 1 : 0;
        unlocked = hasOneTakeApproved;
        break;
      case 'client_whisperer':
        progress = Math.min(approvedVideos.length, 3);
        unlocked = approvedVideos.length >= 3;
        break;
      case 'scope_shield':
        progress = hasHighRevisionProject ? 1 : 0;
        unlocked = hasHighRevisionProject;
        break;
      case 'perfectionist':
        progress = Math.min(totalRevisions, 25);
        unlocked = totalRevisions >= 25;
        break;
      default:
        break;
    }

    return {
      ...ach,
      progress,
      unlocked,
      unlockedAt: unlocked ? new Date().toLocaleDateString() : undefined
    };
  });
}
