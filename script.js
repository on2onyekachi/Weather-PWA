const temperature = document.querySelector('.temperature');
const season = document.querySelector('.season');
const view = document.querySelectorAll('.view');
const weekday = document.querySelector('.date');
const errorDisplay = document.querySelector('.errorMessage');
const mainLocation = document.querySelector('.location');
const loader = document.querySelector('.loader');

window.addEventListener('load', () => {
    const setPosition = (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        receiveGeoCoord(lat, long);
    };

    const showError = (error) => {
        if (error) {
            handleError(error);
            showSaved();
        }
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition, showError, {
            timeout: 10000,
            enableHighAccuracy: false
        });
    } else {
        errorDisplay.innerHTML = '<p>Geolocation not supported. Try searching instead.</p>';
    }
});

function showSaved() {
    const savedWeather = JSON.parse(window.localStorage.getItem('weatherInfo'));
    if (savedWeather && savedWeather.list && savedWeather.list.length > 0) {
        const lastSave = document.querySelector('.saveMessage');
        if (lastSave) {
            lastSave.innerHTML = '<p class="last-save">Showing your last saved result</p>';
            setTimeout(() => { lastSave.innerHTML = ''; }, 3000);
            showWeatherDetails(savedWeather);
        }
    }
}

const fetchData = async (lat, long) => {
    loader.classList.remove('hidden');
    const api = `/.netlify/functions/weather?lat=${lat}&lon=${long}`;
    const response = await fetch(api);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `API error: ${response.status}`);
    }
    return response;
};

function handleError(error) {
    loader.classList.add('hidden');
    const errorMsg = document.createElement('p');
    errorMsg.className = 'error';
    errorMsg.innerText = (error.code === 2)
        ? 'No internet connection'
        : (error.message || 'An error occurred');
    errorDisplay.innerHTML = '';
    errorDisplay.appendChild(errorMsg);
}

function renderOption(data) {
    const { icon, main } = data.weather[0];
    const { temp_max, temp_min } = data.main;
    const date = new Date(data.dt * 1000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    return `
    <div class="special">
        <div class="sub">
            <img class="sub-icon view" src="./icons/${icon}.png" alt="${day} is ${main}">
            <h2 class="sub-season">${main}</h2>
        </div>
        <p class="style weekday">${day}</p>
        <h3 class="side-temp">${Math.round(temp_max)} <span class='low-side-temp'>${Math.round(temp_min)}</span></h3>
        <h4 class="degree">&deg;C</h4>
    </div>`;
}

function showClock(timestamp, timezone = 0) {
    const clock = document.querySelector('.clock');
    try {
        const localTimestamp = timestamp + timezone;
        const date = new Date(localTimestamp * 1000);
        let hours = date.getUTCHours();
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        clock.innerText = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } catch (e) {
        clock.innerText = new Date(timestamp * 1000).toLocaleTimeString();
    }
}

function showDate(timestamp, element, timezone = 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(timestamp * 1000);
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const todate = date.getDate();
    element.innerText = `${day}, ${todate} ${month} ${year}`;
    showClock(timestamp, timezone);
}

function showWeatherDetails(data) {
    if (!data || !data.city || !data.list || data.list.length === 0) {
        handleError(new Error('Invalid weather data received'));
        return;
    }

    const list = document.querySelector('.list');
    const eventSafe = document.querySelector('.safe');
    const cityName = data.city.name;
    const timezone = data.city.timezone || 0;

    const currentWeather = data.list[0];
    const { temp } = currentWeather.main;
    const { description, icon, main } = currentWeather.weather[0];
    const dt = currentWeather.dt;

    loader.classList.add('hidden');
    eventSafe.innerText = (main === 'Clear' || main === 'Clouds') ? 'Safe' : 'Not Safe';
    mainLocation.innerText = cityName;   // always set so search results always update
    temperature.innerText = Math.round(temp);
    season.innerText = description;
    view.forEach(image => {
        image.setAttribute('src', `./icons/${icon}.png`);
        image.setAttribute('alt', `it is currently ${description}`);
    });

    list.innerHTML = '';
    showDate(dt, weekday, timezone);

    const dailyForecasts = {};
    data.list.forEach(forecast => {
        const dateKey = new Date(forecast.dt * 1000).toDateString();
        if (!dailyForecasts[dateKey] || forecast.dt_txt.includes('12:00:00')) {
            dailyForecasts[dateKey] = forecast;
        }
    });

    Object.values(dailyForecasts).slice(0, 5).forEach(day => {
        const div = document.createElement('div');
        div.innerHTML = renderOption(day);
        list.appendChild(div);
    });
}

const receiveGeoCoord = (lat, long) => {
    fetchData(lat, long)
        .then(response => response.json())
        .then(data => {
            if (data && data.list) {
                window.localStorage.setItem('weatherInfo', JSON.stringify(data));
                showWeatherDetails(data);
            }
        })
        .catch(err => {
            showSaved();
            handleError(err);
        });
};

const inputFetch = async (search) => {
    const url = `/.netlify/functions/weather?city=${encodeURIComponent(search)}`;
    const response = await fetch(url);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `API error: ${response.status}`);
    }
    return response;
};

const inputShield = (func, delay = 1000) => {
    let timeOutID;
    return (...args) => {
        if (timeOutID) clearTimeout(timeOutID);
        timeOutID = setTimeout(() => func.apply(null, args), delay);
    };
};

const onInput = async (event) => {
    const query = event.target.value.trim();
    if (!query) return;

    loader.classList.remove('hidden');
    errorDisplay.innerHTML = '';

    inputFetch(query)
        .then(response => response.json())
        .then(data => {
            console.log('FROM INPUT', data);
            window.localStorage.setItem('weatherInfo', JSON.stringify(data));
            showWeatherDetails(data);
        })
        .catch(err => {
            console.log('from input error', err);
            showSaved();
            handleError(err);
        });
};

const inputBox = document.querySelector('#search');
inputBox.addEventListener('input', inputShield(onInput, 1000));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
            if (isLocal) {
                console.log('SW disabled in local dev');
                return;
            }
            const reg = await navigator.serviceWorker.register('./sw.js', {
                scope: './'
            });
            console.log('ServiceWorker registered:', reg.scope);
        } catch (err) {
            console.error('ServiceWorker registration failed:', err);
        }
    });
}