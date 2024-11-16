export interface MemberActivity {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  type: 'join' | 'leave' | 'other';
  status: string;
  oldStatus: string;
}

export interface ChannelInfo {
  memberCount: number;
  administrators: number;
  type: string;
  title: string;
}

export interface Stats {
  total: number;
  joins: number;
  leaves: number;
}