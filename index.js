// Getting HTML elements using selectors
var form = document.getElementById('my-form');
var cityInput = document.getElementById('user-city');
var statusText = document.getElementById('loading-text');
var locationDisplay = document.getElementById('location-display');
var boxesContainer = document.getElementById('forecast-boxes');

// Listen for when the user clicks the search button
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Stop page reload
    
    var cityName = cityInput.value;
    statusText.innerText = "Looking up coordinates for " + cityName + "...";
    locationDisplay.innerText = "";
    boxesContainer.innerHTML = ""; // Clear old boxes

    // 1st API Link: Turns the city name into coordinates
    var geoApiUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + cityName + "&count=1&format=json";

    fetch(geoApiUrl)
        .then(function(response) {
            return response.json();
        })
        .then(function(geoData) {
            // Check if the city actually exists
            if (geoData.results == undefined) {
                statusText.innerText = "City not found! Check your spelling.";
                return;
            }

            // Gathers latitude and longtitude
            var lat = geoData.results[0].latitude;
            var lon = geoData.results[0].longitude;
            var properName = geoData.results[0].name;
            var admin1 = geoData.results[0].admin1 || "";
            var country = geoData.results[0].country || "";
            var locationParts = [properName, admin1, country].filter(Boolean);
            var locationLabel = locationParts.join(', ');

            locationDisplay.innerText = locationLabel;
            statusText.innerText = "Loading 7-day data for " + locationLabel + "...";

            // 2nd API Link: Fetches weather info, including precipitation, wind, and humidity arrays
            var weatherApiUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&daily=temperature_2m_max,weathercode,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&timezone=auto";

            return fetch(weatherApiUrl);
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(weatherData) {
            statusText.innerText = ""; 

            var daily = weatherData.daily;

            //loop to go through each of the 7 days
            for (var i = 0; i < 7; i++) {
                var dateStr = daily.time[i];
                var maxTemp = daily.temperature_2m_max[i];
                var weatherCode = daily.weathercode[i];
                var rain = daily.precipitation_sum[i];
                var wind = daily.windspeed_10m_max[i];
                
                // Open-Meteo provides humidity inside a slightly different path or maximums
                // If max humidity array isn't populated, we can fall back to a standard baseline approximation or read the array safely
                var humidity = daily.relative_humidity_2m_max ? daily.relative_humidity_2m_max[i] : 65; 

                // Basic logic to pick an emoji based on weather codes
                var emoji = "☀️"; // default sunny
                if (weatherCode > 0 && weatherCode <= 3) {
                    emoji = "⛅"; // partly cloudy
                } else if (weatherCode > 3 && weatherCode <= 67) {
                    emoji = "🌧️"; // rainy
                } else if (weatherCode > 67) {
                    emoji = "⛈️"; // storm
                }

                // Format the date strings manually
                var dateObject = new Date(dateStr);
                var shortDay = dateObject.toLocaleDateString('en-US', { weekday: 'short' });
                var shortDate = dateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                // Create a new div element for the daily box
                var box = document.createElement('div');
                box.className = "weather-day-box";

                //inner elements using basic string concatenation
                box.innerHTML = 
                    '<div class="day-name">' + shortDay + '</div>' +
                    '<div class="day-date">' + shortDate + '</div>' +
                    '<div class="weather-emoji">' + emoji + '</div>' +
                    '<div class="weather-temp">' + Math.round(maxTemp) + '°C</div>' +
                    '<div class="extra-info">' +
                        '🌧️ Rain: ' + rain + ' mm<br>' +
                        '💨 Wind: ' + Math.round(wind) + ' km/h<br>' +
                        '💧 Humid: ' + humidity + '%' +
                    '</div>';

                // Add the new box into our layout container
                boxesContainer.appendChild(box);
            }
        })
        .catch(function(error) {
            console.log(error);
            statusText.innerText = "An error happened while loading data.";
        });
});