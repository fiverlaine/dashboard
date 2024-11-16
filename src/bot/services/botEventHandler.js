export default class BotEventHandler {
  constructor(bot, channelId, channelMonitor, socketHandler, memberTracker) {
    this.bot = bot;
    this.channelId = channelId;
    this.channelMonitor = channelMonitor;
    this.socketHandler = socketHandler;
    this.memberTracker = memberTracker;
    this.monitoringActive = false;
    this.monitoringInterval = null;
    this.updateCheckInterval = null;
  }

  async initialize() {
    try {
      await this.setupEventListeners();
      await this.startMonitoring();
      return true;
    } catch (error) {
      console.error('Failed to initialize bot event handler:', error);
      return false;
    }
  }

  async setupEventListeners() {
    // Listen for all relevant chat member updates
    this.bot.on('chat_member_updated', this.handleChatMemberUpdated.bind(this));
    this.bot.on('chat_member', this.handleChatMember.bind(this));
    this.bot.on('channel_post', this.handleChannelPost.bind(this));
    this.bot.on('new_chat_members', this.handleNewMembers.bind(this));
    this.bot.on('left_chat_member', this.handleLeftMember.bind(this));
    this.bot.on('my_chat_member', this.handleMyChatMember.bind(this));
    this.bot.on('polling_error', this.handlePollingError.bind(this));
    this.bot.on('error', this.handleError.bind(this));

    // Initialize channel monitor
    await this.channelMonitor.initialize();
  }

  async startMonitoring() {
    if (this.monitoringActive) return;

    this.monitoringActive = true;

    // Check member changes more frequently
    this.monitoringInterval = setInterval(() => {
      this.checkMemberChanges();
    }, 15000);

    // Check for updates more frequently
    this.updateCheckInterval = setInterval(() => {
      this.checkUpdates();
    }, 5000);

    // Initial checks
    await Promise.all([
      this.checkMemberChanges(),
      this.checkUpdates()
    ]);

    console.log('Member monitoring started with enhanced frequency');
  }

  async handleChatMemberUpdated(update) {
    try {
      if (update.chat.id.toString() === this.channelId.toString()) {
        const activity = await this.memberTracker.trackMemberUpdate(update);
        if (activity) {
          this.socketHandler.emitMemberActivity(activity);
          await this.checkMemberChanges();
        }
      }
    } catch (error) {
      console.error('Error handling chat member update:', error);
    }
  }

  async handleChatMember(msg) {
    try {
      if (msg.chat.id.toString() === this.channelId.toString()) {
        const update = {
          chat: msg.chat,
          new_chat_member: msg.new_chat_member,
          old_chat_member: msg.old_chat_member
        };
        await this.handleChatMemberUpdated(update);
      }
    } catch (error) {
      console.error('Error handling chat member:', error);
    }
  }

  async handleChannelPost(msg) {
    try {
      if (msg.chat.id.toString() === this.channelId.toString()) {
        await this.checkMemberChanges();
      }
    } catch (error) {
      console.error('Error handling channel post:', error);
    }
  }

  async handleNewMembers(msg) {
    try {
      if (msg.chat.id.toString() === this.channelId.toString()) {
        for (const member of msg.new_chat_members) {
          const update = {
            chat: msg.chat,
            new_chat_member: {
              user: member,
              status: 'member'
            },
            old_chat_member: {
              user: member,
              status: 'left'
            }
          };
          await this.handleChatMemberUpdated(update);
        }
      }
    } catch (error) {
      console.error('Error handling new members:', error);
    }
  }

  async handleLeftMember(msg) {
    try {
      if (msg.chat.id.toString() === this.channelId.toString()) {
        const update = {
          chat: msg.chat,
          new_chat_member: {
            user: msg.left_chat_member,
            status: 'left'
          },
          old_chat_member: {
            user: msg.left_chat_member,
            status: 'member'
          }
        };
        await this.handleChatMemberUpdated(update);
      }
    } catch (error) {
      console.error('Error handling left member:', error);
    }
  }

  async handleMyChatMember(msg) {
    try {
      if (msg.chat.id.toString() === this.channelId.toString()) {
        await this.checkMemberChanges();
      }
    } catch (error) {
      console.error('Error handling my chat member:', error);
    }
  }

  handlePollingError(error) {
    console.error('Polling error:', error);
    this.socketHandler.emitToAll('error', { message: 'Bot polling error occurred' });
  }

  handleError(error) {
    console.error('Bot error:', error);
    this.socketHandler.emitToAll('error', { message: 'Bot error occurred' });
  }

  async checkMemberChanges() {
    try {
      const info = await this.channelMonitor.getChannelInfo(true);
      if (info) {
        this.socketHandler.emitChannelInfo(info);
      }
    } catch (error) {
      console.error('Error checking member changes:', error);
    }
  }

  async checkUpdates() {
    try {
      const updates = await this.channelMonitor.getUpdates();
      for (const update of updates) {
        if (update.chat_member) {
          await this.handleChatMember(update.chat_member);
        }
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    this.monitoringActive = false;
    console.log('Member monitoring stopped');
  }
}