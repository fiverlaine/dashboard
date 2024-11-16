import express from 'express';
import memberTracker from './memberTracker.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error response helper
const sendError = (res, error) => {
  logger.error('Route error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
};

// Success response helper
const sendSuccess = (res, data = {}, message = '') => {
  res.json({
    success: true,
    message,
    ...data
  });
};

router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'Bot server is running'
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/activity', asyncHandler(async (req, res) => {
  try {
    const activities = memberTracker.getActivities();
    sendSuccess(res, { activities });
  } catch (error) {
    sendError(res, error);
  }
}));

router.post('/api/bot/connect', asyncHandler(async (req, res) => {
  try {
    if (!req.channelMonitor) {
      throw new Error('Channel monitor not initialized');
    }

    const channelInfo = await req.channelMonitor.getChannelInfo(true);
    if (!channelInfo) {
      throw new Error('Failed to fetch channel information');
    }

    const activities = memberTracker.getActivities();
    
    req.io.emit('channelInfo', channelInfo);
    req.io.emit('initialData', activities);
    
    sendSuccess(res, { 
      channelInfo,
      activities
    }, 'Bot connected successfully');
  } catch (error) {
    sendError(res, error);
  }
}));

router.get('/refresh', asyncHandler(async (req, res) => {
  try {
    if (!req.channelMonitor) {
      throw new Error('Channel monitor not initialized');
    }

    const channelInfo = await req.channelMonitor.getChannelInfo(true);
    if (!channelInfo) {
      throw new Error('Failed to fetch channel information');
    }

    const activities = memberTracker.getActivities();
    
    req.io.emit('channelInfo', channelInfo);
    req.io.emit('initialData', activities);
    
    sendSuccess(res, { 
      channelInfo,
      activities
    }, 'Dashboard data refreshed successfully');
  } catch (error) {
    sendError(res, error);
  }
}));

export default router;