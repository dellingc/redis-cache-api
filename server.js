
const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
 
// create express application instance
const app = express()
 
// create and connect redis client to local instance.
const client = redis.createClient(6379)
 
// echo redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get photos list
app.get('/loc', (req, res) => {
 
    // key to store results in Redis store
    const redisKey = `${req.query.lat}:${req.query.lon}`;
 
    // Try fetching the result from Redis first in case we have it cached
    return client.get(redisKey, (err, temp) => {
 
        // If that key exists in Redis store
        if (temp) {
            console.log(`Key: '${redisKey}' found in cache!`)
            return res.json({ source: 'cache', temperature: JSON.parse(temp) })
 
        } else { // Key does not exist in Redis store
            console.log(`Key: '${redisKey}' not found, calling API`)
            let url = `https://api.darksky.net/forecast/1ca8170494e1aadb70bfda628ce618d4/${req.query.lat},${req.query.lon}`
            // Fetch directly from remote api
            fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                    client.setex(redisKey, 30, JSON.stringify(data.currently.temperature))
 
                    // Send JSON response to client
                    return res.json({ source: 'api', temperature: data.currently.temperature })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error to the client 
                    return res.json(error.toString())
                })
        }
    });
});
 
// start express server at 3000 port
app.listen(3000, () => {
    console.log('Server listening on port: ', 3000)
});