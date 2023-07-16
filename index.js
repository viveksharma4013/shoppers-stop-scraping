import cheerio from "cheerio";
import {Client} from "@googlemaps/google-maps-services-js";
import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 9000;
const dbUri  = process.env.MONGO_URI+"";

let app = new express();
let mongoClient;
const client = new Client({});

const dbName = process.env.DB_NAME;

app.use(express.json());

function getAddresses(mall) {
    const latlng = {
        lat: parseFloat(mall.latitude),
        lng: parseFloat(mall.longitude),
      };
    return client.reverseGeocode({
        params: {
            latlng: latlng,
            key: process.env.GMAPS_APIKEY
        }
    })
}

async function getLatLong(text) {
    const db = mongoClient.db(process.env.DB_NAME);
    const collection = db.collection('addressCollection');
    let $ = cheerio.load(text);
    let malls = JSON.parse($("div#map_canvas").attr("data-stores"));
    for(let mall of malls.data) {
       let result = await getAddresses(mall);
       if(result.data.results[0].formatted_address.toUpperCase().includes(mall.name.toUpperCase())){
            collection.insertOne(mall.name);
            console.log(mall.name);
            console.log(mall.latitude);
            console.log(mall.longitude);
            console.log(r.data.results[0].formatted_address.toUpperCase());
            console.log("__________________________");
        }
    }
}

export async function connectToMongo(){
    try{
        mongoClient = await MongoClient.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to mongo successfully');
    }catch(err){
        console.error('Error connecting to mongo:', err);
        process.exit(1);
    }
}

connectToMongo();
app.listen(port, () => console.log(`App listening on port ${port}!`));

app.get("/result", function (req, res) {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
    
        collection.find().toArray(function (err, result) {
          client.close();
          if (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Failed to fetch data from the database.' });
          }
    
          return res.json(result);
        });
});

app.get("/getMalls", function (req, res) {
    fetch(process.env.MAIN_URL).then(function (html) {
        html.text().then(function (text) {
            getLatLong(text);
            res.status(200).json({ message: "Success"});
        });
    }).catch(function (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    });

});