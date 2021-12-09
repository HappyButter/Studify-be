// @ts-nocheck
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from "http";
import Redis from 'redis';
import { Server } from "socket.io";
import { v4 as uuid_v4 } from "uuid";

import {
  parseEvent,
  setEventTimestamp,
  createFirstMessage
} from './utils/utils.js'

dotenv.config();

const DEFAULT_EXPIRATION = 3600;
// const redisClient = Redis.createClient({host: "http://redis.io", port: "6379"});
// const redisClient = Redis.createClient({url: "redis://127.0.0.1:6379"});
// const redisSubscriber = Redis.createClient({url: "redis://127.0.0.1:6379"});
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
});
let redisSubscriber
// const redisSubscriber = Redis.createClient({
//   url: process.env.REDIS_URL,
//   password: process.env.REDIS_PASSWORD
// });

// redisSubscriber.on("pmessage", function(pattern, channel, message) {
//     console.log(message)
// })


// redisSubscriber.on('connect', async function() {
//   console.log('Connected!'); // Connected!

async function connectRedis() {
  try {
    await redisClient.connect();
    redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();

    await redisSubscriber.pSubscribe('*', (channel, message) => {
      console.log(channel, message)
    })
  } catch (err) {
    console.log(err.message)
  }
}
connectRedis();


// redisSubscriber.PSUBSCRIBE("__keyspace@0__:*", err => console.log("dupa"));

// const redisClient = Redis.createClient({url: "redis-10613.c250.eu-central-1-1.ec2.cloud.redislabs.com:10613"});


// redisClient.connect();
// redisSubscriber.connect();

// async () => await redisSubscriber.pSubscribe("__keyspace@0__:*", err => console.log("dupa"));

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

// let redisSubscriber; 

// x();

// async function x() {
//   try {
//     redisSubscriber = Redis.createClient({url: "redis://127.0.0.1:6379"});
//     // redisSubscriber = redisClient.duplicate();
//     // await redisSubscriber.connect();
//     redisSubscriber.pSubscribe('__key*__:*')
//     redisSubscriber.on('connect', function() {
//       console.log('Connected!'); // Connected!
//     });
//     // redisClient.on('error', (err) => console.log('Redis Client Error', err));
//     // redisClient.pSubscribe("Chat:*"); 

//     // redisClient.on("pmessage", function(channel, message) {
//     //     console.log(message)
//     //     // redisClient.send(message);
//     //   })
//   } catch (err) {
//     console.log(err)
//   }
// }
  
// redisSubscriber.on('error', (err) => console.log('Redis Client Error', err));

// redisSubscriber.on("pmessage", function(channel, message) {
//   console.log(message)
//   redisClient.send(message);
// })



io.on("connection", async (socket) => {
  console.log(`Made socket connection ${socket.id}`);
});

app.get('/', async (req, res) => {
  const x = await redisClient.SETEX("zz", 10, "asdjh");
  // const x = await redisClient.CONFIG_SET("notify-keyspace-events", "KEA");
  console.log(x)
  res.send("Works");
})

app.get('/trigger', (req, res) => {
  
  io.emit("message","super duper message")
  res.status(200);
})

app.get('/events', async (req, res) => {
  const x = await redisClient.GET("Event:b8ad7055-29c7-475d-892a-5660dd58257f");
  console.log(JSON.parse(x))
  res.status(200).send();
})

app.get('/keys', async (req, res) => {
  const x = await redisClient.KEYS("*");
  // const x = await redisClient.CONFIG_SET("notify-keyspace-events", "KEA");
  console.log(x)
  res.send("Works");
})

app.post("/events", async (req, res) => {
  try {
    const eventMapped = parseEvent(req.body);
    const eventReadyToSet = setEventTimestamp(eventMapped);
    const newEventId = uuid_v4();
    
    const firstMessage = createFirstMessage(req.body);

    await redisClient.multi()
      .SETEX(`Event:${newEventId}`, DEFAULT_EXPIRATION, JSON.stringify(eventReadyToSet))
      .SETEX(`UserEvent:${req.body.authorId}`, DEFAULT_EXPIRATION, newEventId)
      .LPUSH(`Chat:${newEventId}`, JSON.stringify(firstMessage))
      .EXPIRE(`Chat:${newEventId}`, DEFAULT_EXPIRATION)
      .LPUSH(`Voted:${newEventId}`, String(req.body.authorId))
      .EXPIRE(`Voted:${newEventId}`, DEFAULT_EXPIRATION)
      .exec()
      
    res.status(200).send()
  } catch(err) {
    console.log(err)
    res.status(400).send("Could not create an event")
  }
})





// app.get('/events', (req, res) => {
//   redisClient.set("hi", "world");
//   res.status(200).send("siema");

//   // try{
//   //   // redisClient.LPUSH("someChatId", "firstMessage")
//   //   redisClient.get("events", async (error, events) => {
//   //     if(error) console.log(error);
//   //     if(events) {
//   //       console.log("cache hit");
//   //       res.status(200).json(events);
//   //     } else {
//   //       console.log("cache miss");
//   //       const pins = [
//   //         {
//   //           id: 1,
//   //           eventName: "1_1",
//   //           eventType: "meeting",
//   //           creationDate: "1999-01-01",
//   //           expiryDate: "1999-01-01",
//   //           description: "Bardzo ładne wydarzenie 1",
//   //           latitude: 50.0659198,
//   //           longitude: 19.9145029,
//   //           authorId: 11
//   //         },
//   //         {
//   //           id: 2,
//   //           eventName: "2+2",
//   //           eventType: "tradeOffer",
//   //           creationDate: "1999-01-01",
//   //           expiryDate: "1999-01-01",
//   //           description: "Bardzo ładne wydarzenie 2",
//   //           latitude: 50.0559198,
//   //           longitude: 19.9245029,
//   //           authorId: 22
//   //         },
//   //         {
//   //           id: 3,
//   //           eventName: "3_3",
//   //           eventType: "alert",
//   //           creationDate: "1999-01-01",
//   //           expiryDate: "1999-01-01",
//   //           description: "Bardzo ładne wydarzenie 3",
//   //           latitude: 50.0529198,
//   //           longitude: 19.9215029,
//   //           authorId: 22
//   //         },
//   //       ];
//   //       redisClient.setEx("events", DEFAULT_EXPIRATION, JSON.stringify(pins));
//   //     }
//   //     res.status(200).json(pins);
//   //   })
//   // } catch (err) {
//   //   console.log(err);
//   // }

// })


server.listen(process.env.PORT || port, () => {
  console.log(`Server listening`)
  console.log(`Listening on port ${port}`);
  console.log(`http://localhost:${port}`);
})


