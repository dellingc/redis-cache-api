const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
const app = express()
const mysql = require('mysql');

const PORT = process.env.PORT || 8000

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    //res.header("Access-Control-Allow-Origin", "https://dellincoinc-wxapp.netlify.com"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Vary: origin");
    next();
  });


weatherDB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mysql'
})

weatherDB.connect((err) => {
    if(err){
        console.log('Error: ' + err)
    } else {
        console.log('connected')
    }
})

// Function to store the API response values in the Redis cache if Redis successfully connects
const apiFetchRedis = (redisKey, url, res) => {
    fetch(url, {method: 'GET'})
                .then((response) => {
                    return response.json()
                })
                .then((data) => {
                    weatherDB.query(`insert into weather (rediskey, timezone, current, daily) values('${redisKey}', '${data.timezone.toString()}', '${JSON.stringify(data.currently)}', '${JSON.stringify(data.daily)}')`, function(err, resp){
                        if(err){
                            console.log(err)
                        } else {
                            console.log(resp)
                        }
                    })
                    
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

function getDBData(key, url, res) {
    weatherDB.query(`select timezone, current, daily from weather where rediskey = '${key}'`, function(err, resp){
        if(err){
            console.log(err)
        } else if(resp[0] == undefined) {
            console.log('key not in db')
            apiFetchRedis(key, url, res)
        } else {
            console.log(`Key ${key} found in DB returning cached results`)
            return res.json({timezone: resp[0].timezone, current: JSON.parse(resp[0].current), daily: JSON.parse(resp[0].daily)})
 
        }
    } )
}


app.get('/loc', (req, res) => {
    let url = `https://api.darksky.net/forecast/1ca8170494e1aadb70bfda628ce618d4/${req.query.lat},${req.query.lon}?exclude=[minutely,hourly]`
    const redisKey = `${req.query.lat}:${req.query.lon}`;
    //checkDBKey(redisKey)
    getDBData(redisKey, url, res)
    //apiFetchRedis(url, redisKey, res)
})

app.listen(PORT, () => {
    console.log('Server listening on port: ', PORT)
});