
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const status = document.getElementById("status");
const weatherCard = document.getElementById("weather-card");
const searchButton = form.querySelector("button");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        status.textContent = "Please enter a city name.";
        return;
    }

    status.textContent = "Loading weather...";
    weatherCard.hidden = true;
    searchButton.disabled = true;

    try {
        // 1. Convert city name into coordinates
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Could not search for the city.");
        }

        const geoData = await geoResponse.json();
        const place = geoData.results?.[0];

        if (!place) {
            throw new Error("City not found. Try another name.");
        }

        // 2. Get weather using latitude and longitude
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${place.latitude}` +
            `&longitude=${place.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m` +
            `&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Could not retrieve weather data.");
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        if (!current) {
            throw new Error("Weather information is unavailable.");
        }

        // 3. Display the weather
        document.getElementById("city-name").textContent =
            `${place.name}, ${place.country}`;

        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature_2m)}°C`;

        document.getElementById("feels-like").textContent =
            `${Math.round(current.apparent_temperature)}°C`;

        document.getElementById("humidity").textContent =
            `${current.relative_humidity_2m}%`;

        document.getElementById("wind").textContent =
            `${current.wind_speed_10m} km/h`;

        document.getElementById("condition").textContent =
            getWeatherCondition(current.weather_code);

        weatherCard.hidden = false;
        status.textContent = "Weather updated successfully!";

    } catch (error) {
        status.textContent = error.message ||
            "Something went wrong. Please try again.";

        console.error(error);

    } finally {
        searchButton.disabled = false;
    }
});

function getWeatherCondition(code) {
    if (code === 0) return "Clear sky ☀️";
    if ([1, 2, 3].includes(code)) return "Partly cloudy ⛅";
    if ([45, 48].includes(code)) return "Foggy 🌫️";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle 🌦️";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "Rainy 🌧️";
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "Snowy ❄️";
    }
    if ([95, 96, 99].includes(code)) return "Thunderstorm ⛈️";

    return "Weather condition unavailable";
}
