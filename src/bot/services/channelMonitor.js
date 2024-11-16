export default class ChannelMonitor {
  constructor(bot, channelId) {
    this.bot = bot;
    this.channelId = channelId;
    this.lastUpdate = null;
    this.cachedInfo = null;
    this.updateInterval = 5000;
    this.monitoringMethods = {
      polling: true,
      updates: true,
      getChat: true
    };
  }

  async initialize() {
    try {
      // Initial channel info fetch
      await this.getChannelInfo(true);
      
      // Set up monitoring methods
      if (this.monitoringMethods.updates) {
        await this.setupUpdateMonitoring();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize channel monitor:', error);
      throw error;
    }
  }

  async setupUpdateMonitoring() {
    try {
      // Get chat administrators to verify bot permissions
      const admins = await this.bot.getChatAdministrators(this.channelId);
      const botAdmin = admins.find(admin => admin.user.id === this.bot.options.polling.params.bot_id);
      
      if (!botAdmin) {
        throw new Error('Bot must be an administrator of the channel');
      }

      return true;
    } catch (error) {
      console.error('Failed to setup update monitoring:', error);
      throw error;
    }
  }

  async getChannelInfo(force = false) {
    try {
      const now = Date.now();
      if (!force && this.cachedInfo && this.lastUpdate && (now - this.lastUpdate < this.updateInterval)) {
        return this.cachedInfo;
      }

      const [chatInfo, memberCount, administrators] = await Promise.all([
        this.bot.getChat(this.channelId).catch(error => {
          throw new Error(`Failed to get chat info: ${error.message}`);
        }),
        this.bot.getChatMemberCount(this.channelId).catch(error => {
          throw new Error(`Failed to get member count: ${error.message}`);
        }),
        this.bot.getChatAdministrators(this.channelId).catch(error => {
          throw new Error(`Failed to get administrators: ${error.message}`);
        })
      ]);

      if (!chatInfo || !['channel', 'group', 'supergroup'].includes(chatInfo.type)) {
        throw new Error(`Invalid chat type: ${chatInfo?.type || 'unknown'}`);
      }

      this.cachedInfo = {
        memberCount,
        administrators: administrators.length,
        type: chatInfo.type,
        title: chatInfo.title,
        lastUpdated: new Date().toISOString()
      };

      this.lastUpdate = now;
      return this.cachedInfo;
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  }

  async getChatMember(userId) {
    try {
      return await this.bot.getChatMember(this.channelId, userId);
    } catch (error) {
      console.error('Error getting chat member:', error);
      throw error;
    }
  }

  async getUpdates() {
    try {
      const updates = await this.bot.getUpdates({
        allowed_updates: ['chat_member', 'my_chat_member', 'channel_post'],
        timeout: 30
      });
      
      return updates.filter(update => 
        update.chat?.id === this.channelId ||
        update.channel_post?.chat.id === this.channelId
      );
    } catch (error) {
      console.error('Error getting updates:', error);
      throw error;
    }
  }

  clearCache() {
    this.cachedInfo = null;
    this.lastUpdate = null;
  }
}