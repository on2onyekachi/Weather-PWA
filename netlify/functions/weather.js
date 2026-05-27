exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    const { lat, lon, city } = params;
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'API key not configured on the server.' }),
        };
    }
    if (!city && (!lat || !lon)) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Provide lat & lon or a city name.' }),
        };
    }
    let url;
    if (city) {
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: data.message || 'Weather API error' }),
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Failed to reach weather service.' }),
        };
    }
};