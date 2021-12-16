// const redisClient = Redis.createClient({host: "http://redis.io", port: "6379"});
// const redisClient = Redis.createClient({url: "redis://127.0.0.1:6379"});
// const redisSubscriber = Redis.createClient({url: "redis://127.0.0.1:6379"});

// const redisSubscriber = Redis.createClient({
//   url: process.env.REDIS_URL,
//   password: process.env.REDIS_PASSWORD
// });

// redisSubscriber.on("pmessage", function(pattern, channel, message) {
//     console.log(message)
// })


// redisSubscriber.on('connect', async function() {
//   console.log('Connected!'); // Connected!



// redisSubscriber.PSUBSCRIBE("__keyspace@0__:*", err => console.log("dupa"));

// const redisClient = Redis.createClient({url: "redis-10613.c250.eu-central-1-1.ec2.cloud.redislabs.com:10613"});


// redisClient.connect();
// redisSubscriber.connect();

// async () => await redisSubscriber.pSubscribe("__keyspace@0__:*", err => console.log("dupa"));


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


// works below!
// app.post("/events", async (req, res) => {
//   try {
//     const eventMapped = parseEvent(req.body);
//     const eventReadyToSet = setEventTimestamp(eventMapped);
//     const newEventId = uuid_v4();
    
//     const firstMessage = createFirstMessage(req.body);

//     await redisClient.multi()
//       .SETEX(`Event:${newEventId}`, DEFAULT_EXPIRATION, JSON.stringify(eventReadyToSet))
//       .SADD(`UserEvent:${req.body.authorId}`, newEventId)
//       .SADD(`UserChat:${req.body.authorId}`, newEventId)
//       .LPUSH(`Chat:${newEventId}`, JSON.stringify(firstMessage))
//       .EXPIRE(`Chat:${newEventId}`, DEFAULT_EXPIRATION)
//       .exec()

//     redisClient.PUBLISH("Chat", JSON.stringify(eventReadyToSet))
//     res.status(200).send()
    
//   } catch(err) {
//     res.status(400).send("Could not create an event")
//   }
// })
