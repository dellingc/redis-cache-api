
#Weather API

This API is used in conjuction with the [Dark Sky React App](https://github.com/dellingc/dark-sky-react-app). 

Built with Node, Express, and Redis. Utilizes API calls to the Dark Sky API. Each call to the Dark Sky API is for a specific location using latitude and longitude. Upon recieving a request for location data from the frontend, the application will first check the Redis cache, if there is data for that location in the cache, this data will be passed as the response. If there is no data for the location in the cache then the app will make a GET request to the Dark Sky API. Upon recieving a response, this data is sent to the frontend and is stored in the Redis cache for 10 minutes, at which point another call will be made to the Dark Sky API if that location is requested again.

## Instructions
Clone the repository, install node packages, and start the server
On your local machine:
```
  git clone https://github.com/dellingc/weather-api.git
  cd weather-api
  npm install
  node server.js
```

Verify that the server is running:

A message will be printed to the terminal that the server is listening on port 8000  
Open your local browser and try accessing:  
    http://localhost:8000/  
    
Return to [Dark Sky React App](https://github.com/dellingc/dark-sky-react-app) and follow README instructions to install and run the app.


## Troubleshooting
The server is configured to run on port 8000, this may need to be changed in your local environment. The server also only accepts requests from http://localhost:3000 which is the port that the Dark Sky React App is configured to run on. Again, this may need to be changed in your local environment.
