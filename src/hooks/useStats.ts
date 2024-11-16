import { useState, useCallback } from 'react';
import { MemberActivity, ChannelInfo, Stats } from '../types';

export function useStats(channelInfo: ChannelInfo | null) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    joins: 0,
    leaves: 0
  });

  const updateStats = useCallback((activities: MemberActivity[]) => {
    const joins = activities.filter(a => a.type === 'join').length;
    const leaves = activities.filter(a => a.type === 'leave').length;
    
    setStats({
      total: channelInfo?.memberCount || (joins - leaves),
      joins,
      leaves
    });
  }, [channelInfo?.memberCount]);

  return { stats, updateStats };
}