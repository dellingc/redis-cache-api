## Weather API

This API is used in conjuction with the [Weather React App](https://github.com/dellingc/weather-react-app). 

Built with Node, Express, and Redis. Utilizes API calls to the Dark Sky API. Each call to the Dark Sky API is for a specific location using latitude and longitude. Upon recieving a request for location data from the frontend, the application will first check the Redis cache, if there is data for that location in the cache, this data will be passed as the response. If there is no data for the location in the cache then the app will make a GET request to the Dark Sky API. Upon recieving a response, this data is sent to the frontend and is stored in the Redis cache for 10 minutes, at which point another call will be made to the Dark Sky API if that location is requested again.

## Instructions
This application requires a local Redis container to run. Please use [Docker](https://hub.docker.com/_/redis) to set up a local Redis container and ensure it is running on port 6379.

Clone the repository, install node packages, and start the server
On your local machine:
```
  git clone https://github.com/dellingc/weather-api.git
  cd weather-api
  npm install
```
At this point you will need to reconfigure the application to run on your local dev instance. Open the server.js file and uncomment line 9. You will also need to comment out line 10. This will ensure that requests are allowed from the front end application running on port 3000. Also in the server.js file on line 20, change 'redis_url' to 'localRedis'. This will ensure that the application is using your local Redis cache.

To start the server:
```
node server.js
```

Verify that the server is running:

A message will be printed to the terminal that the server is listening on port 8000  
Open your local browser and try accessing:  
    http://localhost:8000/loc?lat=37.5260&lon=-77.4416  
    
Return to [Weather React App](https://github.com/dellingc/weather-react-app) and follow README instructions to install and run the app.


## Troubleshooting
The server is configured to run on port 8000, this may need to be changed in your local environment. The server also only accepts requests from http://localhost:3000 which is the port that the Weather React App is configured to run on. Again, this may need to be changed in your local environment.
