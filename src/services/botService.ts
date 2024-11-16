import { ChannelInfo, MemberActivity } from '../types';

export class BotService {
  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (err) {
        console.error('Error parsing error response:', err);
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Server returned invalid content type. Expected JSON.');
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error('Error parsing JSON response:', err);
      throw new Error('Invalid JSON response from server');
    }

    if (!data.success) {
      throw new Error(data.error || 'Operation failed');
    }

    return data;
  }

  static async connect(): Promise<{ channelInfo: ChannelInfo; activities: MemberActivity[] }> {
    try {
      const response = await fetch('/api/bot/connect', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await this.handleResponse(response);
      
      if (!data.channelInfo || typeof data.channelInfo !== 'object') {
        throw new Error('Server returned invalid channel info format');
      }

      if (!Array.isArray(data.activities)) {
        throw new Error('Server returned invalid activities format');
      }

      return {
        channelInfo: data.channelInfo,
        activities: data.activities
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to bot server';
      console.error('Bot connection error:', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  static async refresh(): Promise<{ channelInfo: ChannelInfo; activities: MemberActivity[] }> {
    try {
      const response = await fetch('/api/refresh', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.channelInfo || typeof data.channelInfo !== 'object') {
        throw new Error('Server returned invalid channel info format');
      }

      if (!Array.isArray(data.activities)) {
        throw new Error('Server returned invalid activities format');
      }

      return {
        channelInfo: data.channelInfo,
        activities: data.activities
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      console.error('Data refresh error:', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }
}