const httpServer = require("http").createServer();
const api = require('./api')
const Redis = require("ioredis");
const redisClient = new Redis();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
  adapter: require("socket.io-redis")({
    pubClient: redisClient,
    subClient: redisClient.duplicate(),
  }),
});

const {setupWorker} = require("@socket.io/sticky");
// const crypto = require("crypto");
// const randomId = () => crypto.randomBytes(8).toString("hex");

const {RedisSessionStore} = require("./sessionStore");
const sessionStore = new RedisSessionStore(redisClient);

io.use(async (socket, next) => {
  const user = socket.handshake.auth.user;
  if (user) {
    const sessionID = socket.handshake.auth.user.id;
    const status = await api.checkToken(user.token, user.accountType)
    if (sessionID && status) {
      const session = await sessionStore.findSession(sessionID);
      if (session) {
        const socketList = JSON.parse(session.socketList)
        socketList.push(socket.id)
        socket.socketList = socketList
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        socket.username = session.username;
        socket.token = user.token;
      } else {
        socket.socketList = [socket.id]
        socket.sessionID = user.id;
        socket.userID = user.id;
        socket.username = user.username;
        socket.token = user.token;
      }
      return next();
    } else {
      return next(new Error("Not authenticated"));
    }
  } else {
    return next(new Error("User data is not available"));
  }
});

io.on("connection", async (socket) => {
  const ids = await io.allSockets();

  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    token: socket.token,
    socketList: JSON.stringify(socket.socketList),
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
    token: socket.token,
    socketList: socket.socketList
  });

  // fetch existing messaging rooms
  const userRooms = await api.userRooms(socket.token)
  socket.emit("rooms", userRooms);

  // join existing room
  socket.on("join-room", (room) => {
    socket.join(room)
    console.log(`socket ${socket.id} has joined room ${room}`);
  });

  // send message to a room
  socket.on('send-message', async ({room, content}) => {
    const message = await api.saveMessage({conversationId: room.id, content, token: socket.token})
    io.in(room.room_id).emit("receive-message", message);
    io.to(Array.from(ids)).emit("notification-received", 'test test');
    // todo: update rooms if new message arrives
    // socket.broadcast.emit("update-rooms", {
    //   updatedConversation: room.room_id,
    //   updatedRoom: room.id,
    //   receivers: room.group_members
    // });
  })

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    socketList: socket.socketList,
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    const socketList = [...socket.socketList]
    const socketIdx = socket.socketList.findIndex(el => el === socket.id)

    if (socketIdx !== -1){
      socketList.splice(socketIdx, 1)
    }
    // notify other users
    socket.broadcast.emit("user closed a socket", socket.userID);
    sessionStore.saveSession(socket.sessionID, {
      userID: socket.userID,
      socketList: JSON.stringify(socketList),
      username: socket.username,
      token: socket.token,
      connected: !isDisconnected,
    });
  });
});

setupWorker(io);
