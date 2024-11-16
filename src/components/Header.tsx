import React from 'react';
import { Activity, AlertCircle, RefreshCw, Power } from 'lucide-react';

interface ChannelInfo {
  memberCount: number;
  administrators: number;
  type: string;
  title: string;
}

interface HeaderProps {
  channelInfo: ChannelInfo | null;
  connected: boolean;
  connecting: boolean;
  refreshing: boolean;
  error: string | null;
  onConnect: () => void;
  onRefresh: () => void;
}

export function Header({
  channelInfo,
  connected,
  connecting,
  refreshing,
  error,
  onConnect,
  onRefresh
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-indigo-600" />
              Telegram Channel Monitor
            </h1>
            {channelInfo && (
              <span className="text-sm text-gray-500">
                {channelInfo.title} ({channelInfo.type})
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onConnect}
              disabled={connecting}
              className={`inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                connected ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                connecting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <Power className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
              {connected ? 'Connected' : connecting ? 'Connecting...' : 'Connect Bot'}
            </button>
            <button
              onClick={onRefresh}
              disabled={refreshing || !connected}
              className={`inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                (refreshing || !connected) ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}