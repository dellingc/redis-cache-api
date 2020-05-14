# redis-cache-api

Backend API created for the dark-sky-react application. 

Built with Node, Express, and Redis. Utilizes API calls to the Dark Sky API. Each call to the Dark Sky API is for a specific location using latitude and longitude. Upon recieving a request for location data from the frontend, the application will first check the Redis cache, if there is data for that location in the cache, this data will be passed as the response. If there is no data for the location in the cache then the app will make a GET request to the Dark Sky API. Upon recieving a response, this data is sent to the frontend and is stored in the Redis cache for 10 minutes, at which point another call will be made to the Dark Sky API if that location is requested again.
