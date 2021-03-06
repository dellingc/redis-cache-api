
const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
const app = express()

const PORT = process.env.PORT || 3000

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://dellinco-wxapp.netlify.com"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Vary: origin");
    next();
  });
 
// create and connect redis client to local instance.

const client = redis.createClient(456, {retry_strategy: function(options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error("The server refused the connection");
    }
    if (options.attempt > 5) {
        return new Error("Unable to connect after 5 attempts")
    }
}
})

 
// log redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get weather data
app.get('/loc', (req, res) => {
 
    // create key to store results in Redis cache
    const redisKey = `${req.query.lat}:${req.query.lon}`;
 
    // Return the data from either the cache or make a call to the API
    if(client.connected) {
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
                    client.setex(redisKey, 600, JSON.stringify({temperature: data.currently.temperature, conditions: data.currently.summary}))
 
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
    }
    
});
 
// start express server at 3000 port
app.listen(PORT, () => {
    console.log('Server listening on port: ', PORT)
});