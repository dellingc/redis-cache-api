
const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
const app = express()

const PORT = process.env.PORT || 3000

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
 
// create and connect redis client to local instance.
const client = redis.createClient(process.env.REDIS_URL)
 
// log redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get weather data
app.get('/loc', (req, res) => {
 
    // create key to store results in Redis cache
    const redisKey = `${req.query.lat}:${req.query.lon}`;
 
    // Return the data from either the cache or make a call to the API
    return client.get(redisKey, (err, data) => {
 
        // If that key exists in Redis store
        if (data) {
            console.log(`Key: '${redisKey}' found in cache!`)
            const cacheData = JSON.parse(data)
            return res.json({ source: 'cache', temperature: cacheData.temperature, conditions: cacheData.conditions })
 
        } else { // Key does not exist in Redis cache
            console.log(`Key: '${redisKey}' not found, calling API`)
            let url = `https://api.darksky.net/forecast/1ca8170494e1aadb70bfda628ce618d4/${req.query.lat},${req.query.lon}`
            // Fetch from remote api
            fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    // Save the  API response in Redis cache and set the expire time in seconds
                    client.setex(redisKey, 30, JSON.stringify({temperature: data.currently.temperature, conditions: data.currently.summary}))
 
                    // Send JSON response to client
                    return res.json({ source: 'api', temperature: data.currently.temperature, conditions: data.currently.summary })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error value
                    return res.json(error.toString())
                })
        }
    });
});
 
// start express server at 3000 port
app.listen(PORT, () => {
    console.log('Server listening on port: ', 3000)
});