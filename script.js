const temperature = document.querySelector('.temperature');
const season = document.querySelector('.season');
const view = document.querySelectorAll('.view');
const weekday = document.querySelector('.date');
const errorDisplay = document.querySelector('.errorMessage');
const mainLocation = document.querySelector('.location');
const loader = document.querySelector('.loader');

window.addEventListener('load', () => {
    let long;
    let lat;
    const setPosition = (position) => {
        lat = position.coords.latitude;
        long = position.coords.longitude;
        receiveGeoCoord(lat, long); 
    }

    const showError = (error) => {
        if (error) {
            handleError(error)
            showSaved()
        }
    }

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
    let savedWeather = JSON.parse(window.localStorage.getItem('weatherInfo'))
    console.log('saved weather', savedWeather);
    if (savedWeather && savedWeather.list) {
        const lastSave = document.querySelector('.saveMessage');
        lastSave.innerHTML = `<p class="last-save">Showing your last searched result</p>`;
        setTimeout(() => {
            lastSave.innerHTML = '';
        }, 3000);
        showWeatherDetails(savedWeather);
    } else if (savedWeather && savedWeather.current) {
        window.localStorage.removeItem('weatherInfo');
    }
}
const fetchData = async (lat, long) => {
    const api = `/.netlify/functions/weather?lat=${lat}&lon=${long}`;
    const response = await fetch(api);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `API error: ${response.status}`);
    }
    return response;
}

function handleError(error) {
    loader.classList.add('hidden');
    const errorMsg = document.createElement('p');
    errorMsg.className = 'error';
    errorMsg.innerText = (error.code === 2) ? 'Internet not connected' : (error.message || 'An error occurred');
    errorDisplay.innerHTML = ''; 
    errorDisplay.appendChild(errorMsg);
    return;
}

function renderOption(data) {
    const { icon, main } = data.weather[0];
    const date = new Date(data.dt * 1000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const { temp_max, temp_min } = data.main;
    return `
    <div class="special">
        <div class="sub">
            <img class="sub-icon view" src="./icons/${icon}.png" alt="${day} is ${main}">
            <h2 class="sub-season">${main}</h2>
        </div>
        <p class="style weekday">${day}</p>
        <h3 class="side-temp">${Math.round(temp_max)} <span class='low-side-temp'> ${Math.round(temp_min)}</span></h3>
        <h4 class="degree">&deg;C</h4>
    </div>
    `
}

function showClock(timestamp, timezone = 0) {
    const clock = document.querySelector('.clock');
    try {
        const localTimestamp = timestamp + timezone;
        const date = new Date(localTimestamp * 1000);
        let hours = date.getUTCHours();
        let minutes = date.getUTCMinutes();
        let seconds = date.getUTCSeconds();
        
        // Convert to 12-hour format
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        
        const time = `${h}:${m}:${s} ${ampm}`;
        clock.innerText = time;
    } catch (e) {
        clock.innerText = new Date(timestamp * 1000).toLocaleTimeString();
    }
}

function showDate(timestamp, element, timezone = 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
        'Jan', 'Feb',
        'Mar', 'Apr',
        'May', 'Jun',
        'Jul', 'Aug',
        'Sep', 'Oct',
        'Nov', 'Dec'
    ];
    const date = new Date(timestamp * 1000);
    let day = days[date.getDay()];
    let month = months[date.getMonth()];
    let year = date.getFullYear();
    let todate = date.getDate();
    let theDate = `${day}, ${todate} ${month} ${year}`;
    element.innerText = theDate;
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
    console.log('City:', cityName, 'Timezone offset (seconds):', timezone);
    const currentWeather = data.list[0];
    const { temp } = currentWeather.main; 
    const { description, icon, main } = currentWeather.weather[0];
    const dt = currentWeather.dt;
    loader.classList.add('hidden'); 

    eventSafe.innerText = (main === 'Clear' || main === 'Clouds') ? 'Safe' : 'Not Safe';
    (!mainLocation.innerText) ? mainLocation.innerText = cityName : '';
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
    
    const daily = Object.values(dailyForecasts).slice(0, 5);
    for (let day of daily) {
        const div = document.createElement('div');
        div.innerHTML = renderOption(day);
        list.appendChild(div);
    }
}

const receiveGeoCoord = (lat, long) => {
    fetchData(lat, long)
        .then(response => response.json())
        .then(data => {
            window.localStorage.setItem('weatherInfo', JSON.stringify(data))
            showWeatherDetails(data);
        })
        .catch(err => {
            showSaved();
            handleError(err);
        });
}

const inputFetch = async (search) => {
    const url = `/.netlify/functions/weather?city=${search}`;
    const response = await fetch(url);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `API error: ${response.status}`);
    }
    return response;
}

const inputShield = (func, delay = 1000) => {
    let timeOutID;
    return (...args) => {
        if (timeOutID) {
            clearTimeout(timeOutID)
        }
        timeOutID = setTimeout(() => {
            func.apply(null, args)
        }, delay);
    }
}

const onInput = async (event) => {
    if (event.target.value) {
        loader.className = 'loader';
        const result = await inputFetch(event.target.value)
            .then(response => {
                return response.json();
            }).then(data => {
                console.log('FROM INPUT', data);
                if (data.cod == "404") {
                    handleError(data);
                }
                if (data.coord) {
                    const lat = data.coord.lat;
                    const lon = data.coord.lon;
                    errorDisplay.innerHTML = '';
                    mainLocation.innerText = data.name;
                    receiveGeoCoord(lat, lon);
                }
            }).catch(err => {
                showSaved();
                console.log('from input error', err)
                handleError(err);
            })
    } else {
        return;
    }
};

const inputBox = document.querySelector('#search');
inputBox.addEventListener('input', inputShield(onInput, 1000));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js')
            .then(function (registration) {
                console.log('ServiceWorker registration successful:', registration.scope);
            }, function (err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}