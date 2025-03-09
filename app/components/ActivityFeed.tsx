'use client';

import { FC } from 'react';
import { useSocket } from '../context/SocketContext';
import { cn } from '../lib/utils';

interface ActivityFeedProps {
  className?: string;
}

export const ActivityFeed: FC<ActivityFeedProps> = ({ className }) => {
  const { activities } = useSocket();
  
  return (
    <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
      <h2 className="text-lg font-semibold text-white mb-4">Activity</h2>
      
      {activities.length === 0 ? (
        <p className="text-gray-400 text-sm">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                {activity.userName.charAt(0)}
              </div>
              <div>
                <div className="text-sm">
                  <span className="font-medium text-white">{activity.userName}</span>
                  <span className="text-gray-400">
                    {activity.type === 'create' && ' created '}
                    {activity.type === 'update' && ' updated '}
                    {activity.type === 'delete' && ' deleted '}
                    {activity.type === 'comment' && ' commented on '}
                    {activity.type === 'assign' && ' assigned '}
                  </span>
                  <span className="text-indigo-400">{activity.issueTitle}</span>
                </div>
                {activity.details && (
                  <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed; 