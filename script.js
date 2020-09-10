//get resources from index.html;
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
        lat = 40.7143;
        long = -74.006;
        recieveGeoCoord(lat, long);
    }
    const showError = (error) => {
        if(error){
            handleError(error)
            console.log('from showError error', error)
            showSaved()
        }
    }
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
       errorDisplay.innerHTML = '<p> BROWSER NOT SUPPORTED!! </p>';
    }
});
function showSaved () {
    let savedWeather = JSON.parse(window.localStorage.getItem('weatherInfo'))
    console.log('saved weathher', savedWeather);
    if(savedWeather){
        const lastSave = document.querySelector('.saveMessage');
        lastSave.innerHTML = `<p class="last-save">Showing last searched result`;
        setTimeout(() => {
            lastSave.innerHTML = '';
        }, 3000);
        showWeatherDetails(savedWeather);
    }
}
    // Sending the fetch data with the user search word
    const fetchData = async (lat, long) => { //async on the 
        const api = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=hourly,minutely&units=metric&appid=63a26c5a1034a561f528c2ee51289b63`;
        const response = await fetch(api);
        return response;
    }

    const p = document.querySelector('.error');
    function handleError(error) {
        loader.className += ' hidden';
        p.innerText = (error.code === 2) ? 'Internet not connected' : error.message;
        errorDisplay.appendChild(p);
        return;
    }

    function renderOption(data) {
        const {icon, main} = data.weather[0];
        const date = new Date(data.dt * 1000);
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const day = days[ date.getDay() ];
        const {min, max} = data.temp;
        return `
        <div class="special">
            <div class="sub">
                <img class="sub-icon view" src="./icons/${icon}.png" alt="${day} is ${main}">
                <h2 class="sub-season">${main}</h2>
            </div>
            <p class="style weekday">${day}</p>
            <h3 class="side-temp">${Math.round(max)} <span class='low-side-temp'> ${Math.round(min)}</span></h3>
            <h4 class="degree">&deg;C</h4>
        </div>
        `
    }

    function showClock(timestamp) {
        const clock = document.querySelector('.clock');
        let time = new Date(timestamp * 1000);
        clock.innerText = time.toLocaleTimeString();
    }

    function showDate(timestamp, element) {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const months = [
            'Jan',  'Feb',
            'Mar',  'Apr',
            'May',  'Jun',
            'Jul',  'Aug',
            'Sep',  'Oct',
            'Nov',  'Dec'
        ];
        //this should get the date.
        const date =  new Date(timestamp * 1000);
        let day     = days[ date.getDay() ];
        let month   = months[ date.getMonth() ];
        let year    = date.getFullYear();
        let todate  = date.getDate();
        //  whole day format. 
        let theDate =  `${day}, ${todate} ${month} ${year}`;
        element.innerText = theDate;
        showClock(timestamp);
    }

    function showWeatherDetails(data) {
        const list = document.querySelector('.list');
        const {timezone} = data;
        const {temp, dt} = data.current;
        const {description,icon} = data.current.weather[0];
        loader.className += ' hidden';
        (!mainLocation.innerText) ? mainLocation.innerText = timezone : '';
        temperature.innerText = Math.round(temp);
        season.innerText = description;
        view.forEach(image => {
            image.setAttribute('src', `./icons/${icon}.png`);
            image.setAttribute('alt', `it is currently ${description}`);
        });
        list.innerHTML = '';
        showDate(dt, weekday)
        const daily = data.daily.slice(0, 5);
        for(let day of daily){
            const div = document.createElement('div');
            div.innerHTML = renderOption(day);
           list.appendChild(div);
        }
    }

const recieveGeoCoord = (lat, long) => {
    fetchData(lat, long).then(response => {
        return response.json();
    }).then(data => {
        window.localStorage.setItem('weatherInfo', JSON.stringify(data))
        showWeatherDetails(data);
    }).catch(err => {
        showSaved();
        handleError(err);
    } );
}

const inputFetch = async (search) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${search}&appid=63a26c5a1034a561f528c2ee51289b63`;
    const response = await fetch(url);
    return response; 
}

const inputShield = (func, delay = 1000) => {
    let timeOutID
    return (...args) => {
        if(timeOutID) {
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
        const movies = await inputFetch(event.target.value)
        .then(response => {
            return response.json();
        }).then(data => {
            if (data.cod == "404") {
                handleError(data);
            }
            if(data.coord){
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                errorDisplay.innerHTML = '';
                mainLocation.innerText = data.name;
                recieveGeoCoord(lat, lon);
            }
        }).catch(err => {
            showSaved();
            handleError(err);
        })
    } else { 
        return;
    }
};

const inputBox = document.querySelector('#search');
inputBox.addEventListener('input', inputShield(onInput, 1000) );
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', function() {
//       navigator.serviceWorker.register('./sw.js')
//       .then(function(registration) {
//         // Regsuccessful
//         console.log('ServiceWorker registration successful:', registration.scope);
//       }, function(err) {
//         //failed 
//         console.log('ServiceWorker registration failed: ', err);
//       }).catch(err => err) 
//     });
// }