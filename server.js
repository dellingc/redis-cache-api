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


// Log redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err + ' - code -> ' + err.code)
    client.connected = false
});

const apiFetchRedis = (url, client, redisKey, res) => {
    fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    // Save the  API response in Redis cache and set the expire time in seconds
                    if (client.connected){
                       client.setex(redisKey, 600, JSON.stringify({temperature: data.currently.temperature, conditions: data.currently.summary})) 
                    }
                    
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

const apiFetch = (url, res) => {
    fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
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


app.get('/loc', (req, res) => {
    let url = `https://api.darksky.net/forecast/1ca8170494e1aadb70bfda628ce618d4/${req.query.lat},${req.query.lon}`
    const redisKey = `${req.query.lat}:${req.query.lon}`;
    if(client.connected){
        
        return client.get(redisKey, (err, data) => {
 
            // If that key exists in Redis store
            if (data) {
                console.log(`Key: '${redisKey}' found in cache!`)
                const cacheData = JSON.parse(data)
                return res.json({ source: 'cache', temperature: cacheData.temperature, conditions: cacheData.conditions })
     
            } else {
                console.log(`Location ${req.query.lat}:${req.query.lon} not in cache, calling API`)
                apiFetchRedis(url, client, redisKey, res)
            }
        })
    } else {
        console.log(`Redis not connected calling api => ${req.query.lat}:${req.query.lon}`)
        apiFetch(url, res)
    }
})


app.listen(PORT, () => {
    console.log('Server listening on port: ', PORT)
});
