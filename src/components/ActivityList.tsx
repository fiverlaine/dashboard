import React from 'react';
import { UserPlus, UserMinus, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MemberActivity {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  type: 'join' | 'leave' | 'other';
  status: string;
  oldStatus: string;
}

interface ActivityListProps {
  activities: MemberActivity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No activity recorded yet. Waiting for member updates...</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {activities.slice().reverse().map((activity) => (
        <div key={activity.id} className="px-6 py-4">
          <div className="flex items-center">
            {activity.type === 'join' ? (
              <UserPlus className="w-5 h-5 text-green-500 mr-3" />
            ) : activity.type === 'leave' ? (
              <UserMinus className="w-5 h-5 text-red-500 mr-3" />
            ) : (
              <Activity className="w-5 h-5 text-gray-500 mr-3" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                @{activity.username}
              </p>
              <p className="text-sm text-gray-500">
                {activity.type === 'join' ? 'Joined' : 
                 activity.type === 'leave' ? 'Left' : 'Updated'} at{' '}
                {format(new Date(activity.timestamp), 'HH:mm:ss dd/MM/yyyy')}
              </p>
              <p className="text-xs text-gray-400">
                Status changed from {activity.oldStatus} to {activity.status}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}