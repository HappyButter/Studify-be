// @ts-nocheck
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from "http";
import Redis from 'redis';
import { Server } from "socket.io";
import { v4 as uuid_v4 } from "uuid";

import {
  addUser, 
  getUser,
  onUserDisconnect 
} from './users/users.js'

import {
  parseEvent,
  setEventTimestamp,
  createFirstMessage,
  createMessage,
  parseVoteToExpireTime,
  prepareEventToEmit
} from './utils/utils.js'


dotenv.config();

// const redisClient = Redis.createClient({
//   url: process.env.REDIS_URL,
//   password: process.env.REDIS_PASSWORD
// });
const redisClient = Redis.createClient({url: "redis://127.0.0.1:6379"});
let redisSubscriber = null;

const DEFAULT_EXPIRATION = 100;
const port = 7312; 
const app = express();
const server = createServer(app);
const io = new Server(server, {cors: {
  origin: "*",
  methods: ["GET", "POST"]
}}); 

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.static('public'))

setConnectionRedis();

io.use(async (socket, next) => {
    try{
      const { userId, userName } = socket.handshake.auth;
      const usersChats = await redisClient.SMEMBERS(`UserChat:${userId}`);

      addUser(socket, userId, userName, usersChats);
      
      next();
    } catch (err) {
      console.log(err)
    }
});

io.on("connection", async (socket) => {
  console.log(`Made socket connection ${socket.id}`);

  socket.on("hello", async (t, callback) => {
    // callback({latencyInMiliseconds : Date.now() - t});
    io.sockets.emit("message", "world")
  })

  socket.on("create-event", async (eventContent, t, callback) => {
    try {
      const {userId, userName} = getUser(socket.id);

      const eventMapped = parseEvent({
        ...eventContent, 
        authorId: userId, 
        authorName: userName
      });
      const eventReadyToSet = setEventTimestamp(eventMapped);
      const newEventId = uuid_v4();
      
      const firstMessage = createFirstMessage(eventContent);
  
      await redisClient.multi()
        .SETEX(`Event:${newEventId}`, DEFAULT_EXPIRATION, JSON.stringify(eventReadyToSet))
        .SADD(`UserEvent:${userId}`, newEventId)
        .SADD(`UserChat:${userId}`, newEventId)
        .LPUSH(`Chat:${newEventId}`, JSON.stringify(firstMessage))
        .EXPIRE(`Chat:${newEventId}`, DEFAULT_EXPIRATION)
        .exec()
  
      // redisClient.PUBLISH("Event", JSON.stringify(eventReadyToSet))
      socket.join(newEventId);
      
      socket.broadcast.emit("events", {status: "new"}, prepareEventToEmit(userId, eventReadyToSet));
      callback({status:"ok", latency: Date.now() - t})      
    } catch(err) {
      callback({status: "error", error: err.message})
    }
  })

  socket.on("send-message", async (messageContent, callback) => {
    try {
      console.log("message sent:");
      console.log(messageContent);
      const eventId = messageContent.chatId;

      const {userId, userName} = getUser(socket.id);
      const newMessage = createMessage({
        ...messageContent, 
        authorId: userId, 
        authorName: userName
      });
      
      await redisClient.multi()
        .SADD(`UserChat:${userId}`, eventId)
        .LPUSH(`Chat:${eventId}`, JSON.stringify(newMessage))
        .exec()
      
      socket.join(eventId);
      socket.broadcast.to(eventId).emit("messages", {status: "new"}, newMessage);
      callback({status: "ok"});
    } catch(err) {
      callback({
        status: "error",
        error: err.message
      });
    }
  })

  socket.on("vote", async (voteData, callback) => {
    try {
      console.log("Vote on:");
      console.log(voteData.chatId);

      const eventId = voteData.chatId;
      const additionalTTL = parseVoteToExpireTime(voteData.vote);

      const {userId} = getUser(socket.id); 

      const eventData = await redisClient.multi()
        .TTL(`Event:${eventId}`)
        .GET(`Event:${eventId}`)
        .exec()
      
      const eventTTL = eventData[0];
      const event = JSON.parse(eventData[1]);

      if (event['voted'].indexOf(userId) !== -1) {
        callback({
          status: "error",
          error: "User has already voted!"
        });
        return;
      }
      
      event['voted'] = [...event['voted'], userId];
      event['eventTemperature'] += Math.sign(additionalTTL);

      await redisClient.multi()
        .SETEX(`Event:${eventId}`, eventTTL + additionalTTL, JSON.stringify(event))
        .EXPIRE(`Chat:${eventId}`, eventTTL + additionalTTL)
        .exec()
      
      socket.broadcast.emit("events", {status: "update"}, prepareEventToEmit(userId, event));
      callback({status: "ok"});
    } catch(err) {
      callback({
        status: "error",
        error: err.message
      });
    }
  })

  socket.on("disconnect", () => onUserDisconnect(socket.id))
});

app.get('/', async (req, res) => {
  // const x = await redisClient.SETEX("zz", 10, "asdjh");
  // const x = await redisClient.CONFIG_SET("notify-keyspace-events", "KEA");
  // console.log(x)
  // const x = await redisClient.KEYS("*");
  // console.log(x)  
  res.send("Works"); 
})

app.get('/setup', async (req, res) => {
  const x = await redisClient.CONFIG_SET("notify-keyspace-events", "KEA");
  if(x) res.status(200).send("success");
  res.status(400).send("error");
})

app.get('/flush', async (req, res) => {
  await redisClient.FLUSHALL();
  res.status(200).send();
})

app.get('/keys', async (req, res) => {
  const x = await redisClient.KEYS("*");
  console.log(x)  
  res.status(200).send();
})

app.get('/trigger', async (req, res) => {
  // io.sockets.emit("message", "world")
  // redisClient.SETEX(`bueno`, 10, "kjsdhdjfvsbdv")
  // redisClient.SMEMBERS(`UserEvent:1`);

  // const redisMulti = redisClient.multi();
  // ids.forEach(id => redisMulti.SREM("UserEvent:5", id));
  // await redisMulti.exec();
  
  const usersChats = await redisClient.SMEMBERS(`UserEvent:5`);
  console.log(usersChats);
  res.status(200).send();
})

app.get('/events', async (req, res) => {
  const eventPattern = "Event:";
  const eventKeysList = await scanMatchingKeys(eventPattern + "*");
  console.log(eventKeysList)
  const eventIdsList = getIdsFromStringList(eventKeysList, eventPattern)
  const events = await getKeyValuesFromKeys(eventIdsList, eventPattern);
  res.status(200).send(events);
})


app.get('/events/messages', async (req, res) => {
  const { eventId } = req.body; 
  const chat = await getChatMessages(eventId);
  res.status(200).send(chat);
})

server.listen(process.env.PORT || port, () => {
  console.log(`Server listening`)
  console.log(`Listening on port ${port}`);
  console.log(`http://localhost:${port}`);
})

async function setConnectionRedis() {
  try {
    await redisClient.connect();
    redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();

    // await redisSubscriber.pSubscribe('*', (message, channel) => {
    //   console.log(channel, message);
    //   io.sockets.emit("message", message)
    // })

    await redisSubscriber.subscribe('__keyevent@0__:expired', async (message, channel) => {
      console.log(channel, message);
      try {
        const eventId = getEventIdFromMessage(message);
        await purgeRedisAfterEventExpired(eventId);

        io.sockets.emit("event", {status: "expired"}, eventId);
      } catch (err) {
        console.log(err.message);
      }
    })
  } catch (err) {
    console.log(err.message)
  }
}

async function scanMatchingKeys(pattern){
  const fullEventList = [];
  let cursor = '0';
  
  async function scan() {
  
    // might be pagination implemented here -> depending on COUNT value
    const redisScanReply = await redisClient.SCAN(cursor, {MATCH: pattern, COUNT: 100}); 

    cursor = redisScanReply.cursor;
    fullEventList.push(...redisScanReply.keys);
  
    if(cursor === 0) return fullEventList;
    return scan();
  }

  try {
    return scan();
  } catch (err) {
    return [];
  }
} 

function getIdsFromStringList(list, pattern) {
  return list.map(element => element.split(pattern)[1]);
}

async function getKeyValuesFromKeys(keys, pattern) {
  try {
    const elementList = await keys.reduce(async (prevPromise, key) => {
      const result = await redisClient.GET(pattern + key);
      const prev = await prevPromise;
      
      if(!result) return prev;
      
      prev[key] = JSON.parse(result);
      return prev;
    }, {});

    return elementList;

  } catch (err) {
    return {error: err.message}
  }
}

async function getChatMessages(eventId) {
  try {
    const chat = await redisClient.LRANGE(`Chat:${eventId}`, 0, -1);

    const elementList = chat.reduce((prev, message) => {
      if(!message) return prev;
      prev.push(JSON.parse(message));
      return prev;
    }, []);

    return elementList;
  } catch (err) {
    return [];
  }
}

async function purgeRedisAfterEventExpired(eventId) {
  const keysToBePurged = await scanMatchingKeys("User*:*");
  const redisMulti = redisClient.multi();
  keysToBePurged.forEach(key => redisMulti.SREM(key, eventId));
  await redisMulti.exec();
}

function getEventIdFromMessage(message) {
  if (!message) throw new Error("Invalid event message");
  
  const id = message.split("Event:")[1];
  if (!id) throw new Error("Invalid event message");

  return id;
}