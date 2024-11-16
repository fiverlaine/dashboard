import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { ActivityChart } from './components/ActivityChart';
import { ActivityList } from './components/ActivityList';
import { SocketService } from './services/socketService';
import { BotService } from './services/botService';
import { useStats } from './hooks/useStats';
import { MemberActivity, ChannelInfo } from './types';

function App() {
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [connected, setConnected] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { stats, updateStats } = useStats(channelInfo);
  const [socketService] = useState(() => new SocketService());

  useEffect(() => {
    const socket = socketService.connect();

    socketService.on('connectionChange', (isConnected: boolean) => {
      setConnected(isConnected);
      if (isConnected) {
        setError(null);
      } else {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    socketService.on('error', () => {
      setConnected(false);
      setConnecting(false);
      setError('Failed to connect to server. Please try again.');
    });

    socketService.on('initialData', (data: MemberActivity[]) => {
      setActivities(data);
      updateStats(data);
    });

    socketService.on('memberActivity', (activity: MemberActivity) => {
      setActivities(prev => {
        const newActivities = [...prev, activity];
        updateStats(newActivities);
        return newActivities;
      });
    });

    socketService.on('channelInfo', (info: ChannelInfo) => {
      setChannelInfo(info);
    });

    return () => {
      socketService.disconnect();
    };
  }, [socketService, updateStats]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const { channelInfo, activities } = await BotService.connect();
      setChannelInfo(channelInfo);
      setActivities(activities);
      updateStats(activities);
    } catch (error) {
      console.error('Error connecting bot:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to bot');
    } finally {
      setConnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (!socketService.isConnected()) {
      setError('Not connected to server');
      return;
    }

    setRefreshing(true);
    setError(null);
    
    try {
      const { channelInfo, activities } = await BotService.refresh();
      setChannelInfo(channelInfo);
      setActivities(activities);
      updateStats(activities);
    } catch (error) {
      console.error('Error refreshing:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const getChartData = useCallback(() => {
    return activities
      .slice(-24)
      .map(activity => ({
        time: format(new Date(activity.timestamp), 'HH:mm'),
        members: activity.type === 'join' ? 1 : -1
      }));
  }, [activities]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        channelInfo={channelInfo}
        connected={connected}
        connecting={connecting}
        refreshing={refreshing}
        error={error}
        onConnect={handleConnect}
        onRefresh={handleRefresh}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <StatsCard
            title="Total Members"
            value={channelInfo?.memberCount || stats.total}
            icon={<Users className="w-6 h-6" />}
            color="text-blue-600"
          />
          <StatsCard
            title="New Joins"
            value={stats.joins}
            icon={<UserPlus className="w-6 h-6" />}
            color="text-green-600"
          />
          <StatsCard
            title="Leaves"
            value={stats.leaves}
            icon={<UserMinus className="w-6 h-6" />}
            color="text-red-600"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Member Activity (Last 24h)</h2>
          <ActivityChart data={getChartData()} />
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="max-h-96 overflow-auto">
            <ActivityList activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;