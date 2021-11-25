// @ts-nocheck
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Redis from 'redis';

const redisClient = Redis.createClient();
const DEFAULT_EXPIRATION = 3600;

const port = 7312; 
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.get('/', (req, res) => {
  res.send("Works");
})

app.get('/events', (req, res) => {
  redisClient.get("events", async (error, events) => {
    if(error) console.log(error);
    if(!events) {
      console.log("cache hit");
      res.status(200).json(events);
    } else {
      console.log("cache miss");
      const pins = [
        {
          id: 1,
          eventName: "1_1",
          eventType: "meeting",
          creationDate: "1999-01-01",
          expiryDate: "1999-01-01",
          description: "Bardzo ładne wydarzenie 1",
          latitude: 50.0659198,
          longitude: 19.9145029,
          authorId: 11
        },
        {
          id: 2,
          eventName: "2+2",
          eventType: "tradeOffer",
          creationDate: "1999-01-01",
          expiryDate: "1999-01-01",
          description: "Bardzo ładne wydarzenie 2",
          latitude: 50.0559198,
          longitude: 19.9245029,
          authorId: 22
        },
        {
          id: 3,
          eventName: "3_3",
          eventType: "alert",
          creationDate: "1999-01-01",
          expiryDate: "1999-01-01",
          description: "Bardzo ładne wydarzenie 3",
          latitude: 50.0529198,
          longitude: 19.9215029,
          authorId: 22
        },
      ];
      redisClient.setEx("events", DEFAULT_EXPIRATION, JSON.stringify(pins));
    }
    res.status(200).json(pins);
  })

})

app.listen(process.env.PORT || port, () => {
  console.log(`Server listening`)
})