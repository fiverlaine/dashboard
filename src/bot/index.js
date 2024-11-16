import TelegramBot from 'node-telegram-bot-api';
import memberTracker from './services/memberTracker.js';
import ChannelMonitor from './services/channelMonitor.js';
import SocketHandler from './services/socketHandler.js';
import BotEventHandler from './services/botEventHandler.js';
import ServerSetup from './services/serverSetup.js';
import apiRoutes from './services/routes.js';
import { BOT_CONFIG } from './config/index.js';

class TelegramMonitor {
  constructor() {
    this.bot = new TelegramBot(BOT_CONFIG.token, {
      ...BOT_CONFIG.options,
      polling: {
        ...BOT_CONFIG.options.polling,
        params: {
          timeout: 30,
          allowed_updates: [
            'message',
            'channel_post',
            'chat_member',
            'my_chat_member'
          ]
        }
      }
    });
    
    this.channelMonitor = new ChannelMonitor(this.bot, BOT_CONFIG.channelId);
    this.server = new ServerSetup();
    this.socketHandler = new SocketHandler(this.server.io, this.channelMonitor, memberTracker);
    this.botEventHandler = new BotEventHandler(
      this.bot, 
      BOT_CONFIG.channelId,
      this.channelMonitor,
      this.socketHandler,
      memberTracker
    );
  }

  async initialize() {
    try {
      // Setup server components
      this.server.setupMiddleware(this.channelMonitor, memberTracker);
      this.server.setupHealthCheck(this.bot);
      this.server.setupRoutes(apiRoutes);
      
      // Initialize socket handling
      this.socketHandler.initialize();
      
      // Initialize bot event handling
      await this.botEventHandler.initialize();
      
      // Start the server
      this.server.start();
      
      console.log(`Bot monitoring channel: ${BOT_CONFIG.channelId}`);
    } catch (error) {
      console.error('Error during initialization:', error);
      setTimeout(() => this.initialize(), 5000);
    }
  }
}

const monitor = new TelegramMonitor();
monitor.initialize();