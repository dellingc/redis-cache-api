const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
const app = express()

const PORT = process.env.PORT || 8000

app.use(function(req, res, next) {
    //res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Origin", "https://dellincoinc-wxapp.netlify.com"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Vary: origin");
    next();
  });

//Heroku redis instance port  
const redis_url = process.env.REDIS_URL

const client = redis.createClient(process.env.REDIS_URL, {
    retry_strategy: function(options) {
        if(options.attempt > 5) {
            console.log('Max attempts')
            return new Error('Max number of retry attempts reached')
        }
        if (options.error && options.error.code === "ECONNREFUSED") {
          console.log(options.error.code + ' - attempt - ' + options.attempt)
          return new Error('The server refused the connection')
        } 
        return 1000
    },
});

client.on('connect', () => {
    console.log(`Redis connection = ${client.connected}`);
})

// Log redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err + ' - code -> ' + err.code)
    console.log(`Redis connection = ${client.connected}`)
    //client.connected = false
});

// Function to store the API response values in the Redis cache if Redis successfully connects
const apiFetchRedis = (url, client, redisKey, res) => {
    fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    // Save the  API response in Redis cache and set the expire time in seconds
                    if (client.connected){
                       client.setex(redisKey, 600, JSON.stringify({timezone: data.timezone, current: data.currently, daily: data.daily})) 
                    }
                    
                    // Send JSON response to client
                    return res.json({ source: 'api', timezone: data.timezone, current: data.currently, daily: data.daily })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error value
                    return res.json(error.toString())
                })
}

// Function to only call the API if Redis is not connected
const apiFetch = (url, res) => {
    fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    // Send JSON response to client
                    return res.json({ source: 'api', timezone: data.timezone, current: data.currently, daily: data.daily })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error value
                    return res.json(error.toString())
                })
}


app.get('/loc', (req, res) => {
    // URL for Dark Sky endpoint, excludes minutely and hourly forecast data
    let url = `https://api.darksky.net/forecast/1ca8170494e1aadb70bfda628ce618d4/${req.query.lat},${req.query.lon}?exclude=[minutely,hourly]`
    const redisKey = `${req.query.lat}:${req.query.lon}`;
    // If the redis client is connected, first check the cache for the data
    // If the data is not in the cache, use the apiFetchRedis() function to call the Dark Sky API and then cache the data
    if(client.connected){ 
        return client.get(redisKey, (err, data) => {
            if (data) { // If that key exists in Redis store return that data to the client
                console.log(`Key: '${redisKey}' found in cache!`)
                const cacheData = JSON.parse(data)
                return res.json({ source: 'cache', timezone: cacheData.timezone, current: cacheData.current, daily: cacheData.daily })
            } else { // If data not in cache, call the Dark Sky API
                console.log(`Location ${req.query.lat}:${req.query.lon} not in cache, calling API`)
                apiFetchRedis(url, client, redisKey, res)
            }
        })
    } else { //If redis client is not connected use apiFetch() to go straight to the Dark Sky API and not attempt caching
        console.log(`Redis not connected calling api => ${req.query.lat}:${req.query.lon}`)
        apiFetch(url, res)
    }
})


app.listen(PORT, () => {
    console.log('Server listening on port: ', PORT)
});