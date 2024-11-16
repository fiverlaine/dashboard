import { EventEmitter } from 'events';

class MemberTracker extends EventEmitter {
  constructor() {
    super();
    this.activities = [];
    this.lastMemberCount = 0;
    this.processQueue = [];
    this.processing = false;
  }

  async trackMemberUpdate(update) {
    return new Promise((resolve) => {
      this.processQueue.push({ update, resolve });
      this.processNextUpdate();
    });
  }

  async processNextUpdate() {
    if (this.processing || this.processQueue.length === 0) return;

    this.processing = true;
    const { update, resolve } = this.processQueue.shift();

    try {
      const activity = this.createActivity(update);
      if (activity) {
        this.activities.push(activity);
        this.emit('memberActivity', activity);
        console.log('Activity processed successfully:', activity);
      }
      resolve(activity);
    } catch (error) {
      console.error('Error processing member update:', error);
      resolve(null);
    } finally {
      this.processing = false;
      if (this.processQueue.length > 0) {
        this.processNextUpdate();
      }
    }
  }

  createActivity(update) {
    const { new_chat_member, old_chat_member, chat } = update;
    
    if (!new_chat_member?.user || !old_chat_member?.status) {
      console.warn('Invalid member update data received');
      return null;
    }

    console.log('Creating activity from update:', {
      new_status: new_chat_member.status,
      old_status: old_chat_member.status,
      user: new_chat_member.user,
      chat_id: chat.id,
      timestamp: new Date().toISOString()
    });

    return {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userId: new_chat_member.user.id,
      username: new_chat_member.user.username || `User${new_chat_member.user.id}`,
      type: this.determineActivityType(old_chat_member.status, new_chat_member.status),
      status: new_chat_member.status,
      oldStatus: old_chat_member.status,
      chatId: chat.id
    };
  }

  determineActivityType(oldStatus, newStatus) {
    console.log('Status transition:', { oldStatus, newStatus });
    
    if (oldStatus === 'left' && ['member', 'administrator', 'creator'].includes(newStatus)) {
      return 'join';
    }
    
    if (['member', 'administrator', 'creator'].includes(oldStatus) && 
        ['left', 'kicked', 'restricted'].includes(newStatus)) {
      return 'leave';
    }
    
    if (oldStatus !== newStatus) {
      return 'other';
    }
    
    return 'other';
  }

  getActivities() {
    return this.activities;
  }

  clearOldActivities() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.activities = this.activities.filter(activity => 
      new Date(activity.timestamp).getTime() > oneDayAgo
    );
  }

  async refreshActivities(channelMonitor) {
    try {
      const info = await channelMonitor.getChannelInfo();
      if (info) {
        if (this.lastMemberCount !== info.memberCount) {
          console.log('Member count changed:', {
            old: this.lastMemberCount,
            new: info.memberCount
          });
          this.lastMemberCount = info.memberCount;
        }
        this.emit('channelInfo', info);
      }
      return info;
    } catch (error) {
      console.error('Error refreshing activities:', error);
      return null;
    }
  }
}

export default new MemberTracker();