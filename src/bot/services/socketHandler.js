export default class SocketHandler {
  constructor(io, channelMonitor, memberTracker) {
    this.io = io;
    this.channelMonitor = channelMonitor;
    this.memberTracker = memberTracker;
    this.connectedClients = new Set();
    this.heartbeatInterval = null;
  }

  initialize() {
    this.setupHeartbeat();

    this.io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.add(socket.id);
      
      try {
        // Send initial data
        const activities = this.memberTracker.getActivities();
        socket.emit('initialData', activities);
        
        // Send current channel info
        const channelInfo = await this.channelMonitor.getChannelInfo();
        if (channelInfo) {
          socket.emit('channelInfo', channelInfo);
        }

        // Handle heartbeat
        socket.on('heartbeat', () => {
          socket.emit('heartbeat_response');
        });

        // Setup disconnect handler
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          this.connectedClients.delete(socket.id);
        });

        // Setup error handler
        socket.on('error', (error) => {
          console.error('Socket error:', error);
          socket.emit('error', { message: 'Connection error occurred' });
        });

      } catch (error) {
        console.error('Error handling socket connection:', error);
        socket.emit('error', { message: 'Failed to initialize connection' });
      }
    });

    // Listen for member tracker events
    this.memberTracker.on('memberActivity', (activity) => {
      this.emitToAll('memberActivity', activity);
    });

    this.memberTracker.on('channelInfo', (info) => {
      this.emitToAll('channelInfo', info);
    });
  }

  setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connectedClients.size > 0) {
        this.io.emit('heartbeat_check');
      }
    }, 30000);
  }

  emitToAll(event, data) {
    if (this.connectedClients.size > 0) {
      this.io.emit(event, data);
    }
  }

  emitMemberActivity(activity) {
    this.emitToAll('memberActivity', activity);
  }

  emitChannelInfo(info) {
    this.emitToAll('channelInfo', info);
  }
}