const fetch = require('node-fetch');

const baseURL = 'https://api.darksky.net/forecast/';
const KEY = '1ca8170494e1aadb70bfda628ce618d4'
const maxxLat = '37.5260'
const maxxLon = '-77.4416'
const reqURL = baseURL + KEY + '/' 

function darkSky(lat, lon) {
    fetch(reqURL + lat + ',' + lon, {method: 'GET'})
    .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(`Current Temp: ${data.currently.temperature}`);
      });
}

darkSky(maxxLat, maxxLon)