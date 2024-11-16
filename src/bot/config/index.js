export const BOT_CONFIG = {
  token: '7323936090:AAEN9Mmx02VzwdEwFb317Ykbs4LvK4fyS7I',
  channelId: -1002406299839,
  options: {
    polling: true,
    webHook: false,
    testEnvironment: false,
    baseApiUrl: "https://api.telegram.org"
  }
};

export const SERVER_CONFIG = {
  port: process.env.PORT || 3000,
  cors: {
    origin: ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  socket: {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    cors: {
      origin: ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"],
      methods: ["GET", "POST"],
      credentials: true
    }
  }
};