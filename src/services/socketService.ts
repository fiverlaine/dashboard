import { io, Socket } from 'socket.io-client';
import { MemberActivity, ChannelInfo } from '../types';

export class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private connectionTimeout = 30000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.cleanup();
    }

    this.socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: this.connectionTimeout,
      autoConnect: true,
      forceNew: true,
      withCredentials: true
    });

    this.setupEventListeners();
    this.startHeartbeat();
    return this.socket;
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, 25000);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.reconnectAttempts = 0;
      this.emit('connectionChange', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('connectionChange', false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('error', new Error('Failed to connect after maximum attempts'));
        this.cleanup();
      } else {
        setTimeout(() => this.connect(), this.reconnectDelay * Math.min(this.reconnectAttempts, 5));
      }
    });

    this.socket.on('heartbeat_response', () => {
      this.emit('connectionChange', true);
    });

    this.socket.on('initialData', (data: MemberActivity[]) => {
      if (Array.isArray(data)) {
        this.emit('initialData', data);
      }
    });

    this.socket.on('memberActivity', (activity: MemberActivity) => {
      if (activity && activity.type) {
        this.emit('memberActivity', activity);
      }
    });

    this.socket.on('channelInfo', (info: ChannelInfo) => {
      if (info && info.memberCount !== undefined) {
        this.emit('channelInfo', info);
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('Server error:', error);
      this.emit('error', new Error(error?.message || 'Server error occurred'));
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  disconnect() {
    this.cleanup();
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}