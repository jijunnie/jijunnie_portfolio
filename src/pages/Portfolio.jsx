import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, MapPin, Phone, Mail, Send, X, Calendar, Linkedin, Github, Instagram, MessageSquare, Music, Image, Palette, Volume2, Monitor } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useGLTF } from '@react-three/drei';
import GLBIcon from '../components/3d/GLBIcon';
import LivingRoomBackground from '../components/3d/LivingRoomBackground';

// Preload 3D background model at module level (runs immediately when file loads)
const backgroundModelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';
try {
  useGLTF.preload(backgroundModelUrl);
  console.log('✅ Preloaded 3D background at module level:', backgroundModelUrl);
} catch (error) {
  console.warn('⚠️ Failed to preload 3D background at module level:', error);
}

// Preload all icon GLB files at module level
const iconFiles = [
  '/icons/weather.glb',
  '/icons/message.glb',
  '/icons/clock.glb',
  '/icons/file.glb',
  '/icons/music.glb',
  '/icons/photo.glb',
  '/icons/video.glb',
  '/icons/safari.glb',
  '/icons/setting.glb',
  '/icons/findmy.glb'
];

iconFiles.forEach((url) => {
  try {
    useGLTF.preload(url);
    console.log('✅ Preloaded icon at module level:', url);
  } catch (error) {
    console.warn('⚠️ Failed to preload icon at module level:', url, error);
  }
});

// Real-time Date/Time Component
function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="text-center mb-3 pb-3 border-b border-white/20 flex-shrink-0">
      <div className="text-3xl font-light text-gray-800 tracking-tight mb-1 leading-none">
        {formatTime(dateTime)}
      </div>
      <div className="text-sm text-gray-600 font-medium">
        {getDayOfWeek(dateTime)}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {formatDate(dateTime)}
      </div>
    </div>
  );
}

// Expanded Clock Panel Component
function ClockPanel() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayOfWeek = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getTimezone = (date) => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeZoneName = date.toLocaleTimeString('en-US', {
        timeZoneName: 'short'
      });
      
      // Extract timezone abbreviation (e.g., "EST", "PST", "GMT")
      const match = timeZoneName.match(/\s([A-Z]{2,5})$/);
      if (match) {
        return match[1];
      }
      
      // Fallback: try to get timezone from timeZone string
      const tzMap = {
        'America/New_York': 'EST',
        'America/Chicago': 'CST',
        'America/Denver': 'MST',
        'America/Los_Angeles': 'PST',
        'America/Phoenix': 'MST',
        'America/Anchorage': 'AKST',
        'Pacific/Honolulu': 'HST',
        'Europe/London': 'GMT',
        'Europe/Paris': 'CET',
        'Asia/Tokyo': 'JST',
        'Asia/Shanghai': 'CST',
        'Australia/Sydney': 'AEST'
      };
      
      return tzMap[timeZone] || timeZone.split('/').pop() || 'Local';
    } catch (e) {
      return 'Local';
    }
  };

  const currentDate = dateTime;
  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const days = useMemo(() => {
    const d = [];
    for (let i = 0; i < firstDay; i++) d.push(null);
    for (let i = 1; i <= daysInMonth; i++) d.push(i);
    return d;
  }, [firstDay, daysInMonth]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div 
      className="h-full flex flex-col md:flex-row"
      style={{
        gap: 'clamp(8px, 2vw, 24px)',
        padding: 'clamp(4px, 1vw, 16px)',
      }}
    >
      {/* Top/Left side - Current time */}
      <div className="flex-1 md:flex-shrink-0 md:w-[45%] flex flex-col justify-center text-center md:text-left md:pl-4 md:pr-8 min-w-0">
        <div className="mb-3 md:mb-4">
          <div 
            className="font-light text-gray-800 tracking-tight mb-2 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
          >
            {formatTime(dateTime)}
          </div>
          <div 
            className="text-gray-500 uppercase tracking-wider"
            style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
          >
            {getTimezone(dateTime)} Time
          </div>
        </div>
        
        <div className="space-y-1">
          <div 
            className="font-semibold text-gray-800"
            style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)' }}
          >
            {getDayOfWeek(dateTime)}
          </div>
          <div 
            className="text-gray-600"
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}
          >
            {formatDate(dateTime)}
          </div>
        </div>
      </div>

      {/* Bottom/Right side - Calendar */}
      <div 
        className="flex-1 md:flex-1 flex flex-col bg-white/10 rounded-2xl min-w-0"
        style={{ padding: 'clamp(8px, 2vw, 16px)' }}
      >
        <div className="text-center mb-1 md:mb-3 flex-shrink-0">
          <h2 
            className="font-semibold text-gray-800"
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)' }}
          >
            {monthName}
          </h2>
        </div>
        
        <div 
          className="grid grid-cols-7 mb-1 md:mb-2 flex-shrink-0"
          style={{ gap: 'clamp(2px, 0.5vw, 8px)' }}
        >
          {weekDays.map((day, idx) => (
            <div 
              key={idx} 
              className="text-center font-semibold text-gray-500"
              style={{ 
                fontSize: 'clamp(0.625rem, 1.5vw, 0.875rem)',
                padding: 'clamp(2px, 0.5vw, 4px) 0'
              }}
            >
              {day}
            </div>
          ))}
        </div>
        
        <div 
          className="grid grid-cols-7 flex-1 content-start"
          style={{ gap: 'clamp(2px, 0.5vw, 8px)' }}
        >
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square flex items-center justify-center rounded-md md:rounded-xl font-medium
                transition-all duration-200
                ${day === today 
                  ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/30 scale-110' 
                  : day 
                    ? 'bg-white/20 text-gray-700 hover:bg-white/30 hover:scale-105' 
                    : ''
                }
              `}
              style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Real-time Calendar Component
function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;
    
    const midnightTimer = setTimeout(() => {
      setCurrentDate(new Date());
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, [currentDate]);

  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const days = useMemo(() => {
    const d = [];
    for (let i = 0; i < firstDay; i++) d.push(null);
    for (let i = 1; i <= daysInMonth; i++) d.push(i);
    return d;
  }, [firstDay, daysInMonth]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="text-center mb-2 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-800">{monthName}</h2>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center text-[10px] font-semibold text-gray-500 py-0.5">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square flex items-center justify-center rounded-lg text-xs font-medium
              transition-colors duration-200
              ${day === today 
                ? 'bg-blue-500/90 text-white shadow-sm shadow-blue-500/30' 
                : day 
                  ? 'bg-white/10 text-gray-700 hover:bg-white/25' 
                  : ''
              }
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

// Weather Widget - with immediate fallback data
function WeatherWidget({ compact = true }) {
  const [weather, setWeather] = useState({
    temp: 72,
    feelsLike: 70,
    humidity: 55,
    windSpeed: 8,
    condition: 'Sunny',
    icon: 'sun',
    location: 'New York',
    country: 'US',
    high: 78,
    low: 65,
    forecast: [
      { day: 'Tue', temp: 74, icon: 'sun' },
      { day: 'Wed', temp: 71, icon: 'cloud' },
      { day: 'Thu', temp: 73, icon: 'sun' },
      { day: 'Fri', temp: 69, icon: 'rain' },
      { day: 'Sat', temp: 72, icon: 'sun' },
      { day: 'Sun', temp: 75, icon: 'sun' },
      { day: 'Mon', temp: 70, icon: 'cloud' }
    ],
    hourly: [
      { time: 'Now', temp: 72, icon: 'sun' },
      { time: '1PM', temp: 74, icon: 'sun' },
      { time: '2PM', temp: 76, icon: 'sun' },
      { time: '3PM', temp: 77, icon: 'sun' },
      { time: '4PM', temp: 75, icon: 'cloud' },
      { time: '5PM', temp: 73, icon: 'cloud' },
      { time: '6PM', temp: 70, icon: 'cloud' }
    ]
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                
                // Fetch city name using reverse geocoding
                let cityName = 'Your Location';
                let countryName = '';
                try {
                  const geoResponse = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                  );
                  if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    cityName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Your Location';
                    countryName = geoData.countryName || '';
                  }
                } catch (geoError) {
                  console.log('Geocoding error:', geoError);
                }
                
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7&temperature_unit=fahrenheit&wind_speed_unit=mph`
                );
                
                if (!response.ok) return;
                
                const data = await response.json();
                
                const weatherCodes = {
                  0: { condition: 'Clear', icon: 'sun' },
                  1: { condition: 'Clear', icon: 'sun' },
                  2: { condition: 'Cloudy', icon: 'cloud' },
                  3: { condition: 'Overcast', icon: 'cloud' },
                  45: { condition: 'Foggy', icon: 'cloud' },
                  48: { condition: 'Foggy', icon: 'cloud' },
                  51: { condition: 'Drizzle', icon: 'rain' },
                  53: { condition: 'Drizzle', icon: 'rain' },
                  55: { condition: 'Drizzle', icon: 'rain' },
                  61: { condition: 'Rain', icon: 'rain' },
                  63: { condition: 'Rain', icon: 'rain' },
                  65: { condition: 'Rain', icon: 'rain' },
                  71: { condition: 'Snow', icon: 'cloud' },
                  73: { condition: 'Snow', icon: 'cloud' },
                  75: { condition: 'Snow', icon: 'cloud' },
                  80: { condition: 'Showers', icon: 'rain' },
                  81: { condition: 'Showers', icon: 'rain' },
                  82: { condition: 'Showers', icon: 'rain' },
                  95: { condition: 'Storm', icon: 'rain' },
                };
                
                const currentCode = data.current?.weather_code || 0;
                const weatherInfo = weatherCodes[currentCode] || { condition: 'Clear', icon: 'sun' };
                
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const forecast = (data.daily?.time || []).slice(1, 8).map((date, idx) => {
                  const d = new Date(date);
                  const code = data.daily?.weather_code?.[idx + 1] || 0;
                  const forecastInfo = weatherCodes[code] || { condition: 'Clear', icon: 'sun' };
                  return {
                    day: dayNames[d.getDay()],
                    temp: Math.round(data.daily?.temperature_2m_max?.[idx + 1] || 70),
                    low: Math.round(data.daily?.temperature_2m_min?.[idx + 1] || 60),
                    icon: forecastInfo.icon
                  };
                });

                // Get hourly forecast for next 7 hours
                const currentHour = new Date().getHours();
                const hourly = [];
                for (let i = 0; i < 7; i++) {
                  const hourIndex = currentHour + i;
                  if (hourIndex < (data.hourly?.time?.length || 0)) {
                    const code = data.hourly?.weather_code?.[hourIndex] || 0;
                    const hourInfo = weatherCodes[code] || { condition: 'Clear', icon: 'sun' };
                    const hour = (currentHour + i) % 24;
                    const timeStr = i === 0 ? 'Now' : `${hour > 12 ? hour - 12 : hour || 12}${hour >= 12 ? 'PM' : 'AM'}`;
                    hourly.push({
                      time: timeStr,
                      temp: Math.round(data.hourly?.temperature_2m?.[hourIndex] || 70),
                      icon: hourInfo.icon
                    });
                  }
                }
                
                setWeather({
                  temp: Math.round(data.current?.temperature_2m || 72),
                  feelsLike: Math.round(data.current?.apparent_temperature || 70),
                  humidity: Math.round(data.current?.relative_humidity_2m || 55),
                  windSpeed: Math.round(data.current?.wind_speed_10m || 8),
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  location: cityName,
                  country: countryName,
                  high: Math.round(data.daily?.temperature_2m_max?.[0] || 78),
                  low: Math.round(data.daily?.temperature_2m_min?.[0] || 65),
                  forecast: forecast.length > 0 ? forecast : weather.forecast,
                  hourly: hourly.length > 0 ? hourly : weather.hourly
                });
              } catch (e) {
                console.log('Weather API error:', e);
              }
            },
            () => {}
          );
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const WeatherIcon = ({ type, className }) => {
    switch (type) {
      case 'sun':
        return <Sun className={className} />;
      case 'rain':
        return <CloudRain className={className} />;
      case 'cloud':
      default:
        return <Cloud className={className} />;
    }
  };

  if (compact) {
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-2 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 truncate">{weather.location}</h2>
          {weather.country && <p className="text-xs text-gray-500">{weather.country}</p>}
        </div>

        <div className="flex items-center justify-center mb-2 flex-shrink-0">
          <WeatherIcon 
            type={weather.icon} 
            className="w-14 h-14 text-yellow-400 drop-shadow-lg" 
          />
        </div>

        <div className="text-center mb-3 flex-shrink-0">
          <div className="text-3xl font-bold text-gray-800 leading-none">
            {weather.temp}°F
          </div>
          <div className="text-xs text-gray-600 mt-1">{weather.condition}</div>
        </div>

        <div className="bg-white/10 rounded-xl p-3 mb-3 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">Wind</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{weather.windSpeed} mph</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">Humidity</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{weather.humidity}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">Feels</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{weather.feelsLike}°F</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/20 mt-auto flex-shrink-0">
          <div className="flex justify-between text-center">
            {weather.forecast.slice(0, 3).map((day, idx) => (
              <div key={idx} className="flex-1">
                <p className="text-[10px] text-gray-500 mb-1">{day.day}</p>
                <WeatherIcon 
                  type={day.icon} 
                  className="w-5 h-5 mx-auto mb-1 text-yellow-400" 
                />
                <p className="text-xs font-semibold text-gray-800">{day.temp}°</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Expanded weather view
  return (
    <div 
      className="min-h-full flex flex-col md:flex-row"
      style={{
        gap: 'clamp(12px, 3vw, 24px)',
        padding: 'clamp(8px, 1.5vw, 16px)',
      }}
    >
      {/* Left side - Current weather */}
      <div className="flex-shrink-0 md:w-1/3 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 mb-2" style={{ gap: 'clamp(4px, 1vw, 8px)' }}>
          <MapPin style={{ width: 'clamp(14px, 2vw, 16px)', height: 'clamp(14px, 2vw, 16px)' }} className="text-gray-500" />
          <h2 
            className="font-semibold text-gray-800"
            style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}
          >
            {weather.location}
          </h2>
        </div>
        
        <WeatherIcon 
          type={weather.icon} 
          className="text-yellow-400 drop-shadow-lg mb-2"
          style={{ width: 'clamp(60px, 12vw, 96px)', height: 'clamp(60px, 12vw, 96px)' }}
        />
        
        <div 
          className="font-light text-gray-800 mb-1"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 3.75rem)' }}
        >
          {weather.temp}°
        </div>
        <div 
          className="text-gray-600 mb-2"
          style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
        >
          {weather.condition}
        </div>
        
        <div 
          className="flex text-gray-600"
          style={{ 
            gap: 'clamp(8px, 2vw, 12px)',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
          }}
        >
          <span>H: {weather.high}°</span>
          <span>L: {weather.low}°</span>
        </div>

        <div 
          className="mt-4 grid grid-cols-2 w-full"
          style={{ 
            gap: 'clamp(8px, 2vw, 12px)',
            maxWidth: 'clamp(160px, 30vw, 200px)',
            marginTop: 'clamp(12px, 3vw, 16px)'
          }}
        >
          <div 
            className="bg-white/20 rounded-xl text-center"
            style={{ padding: 'clamp(8px, 1.5vw, 12px)' }}
          >
            <Wind 
              className="mx-auto text-gray-600 mb-1" 
              style={{ width: 'clamp(14px, 2vw, 16px)', height: 'clamp(14px, 2vw, 16px)' }}
            />
            <div 
              className="text-gray-500"
              style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
            >
              Wind
            </div>
            <div 
              className="font-semibold text-gray-800"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
            >
              {weather.windSpeed} mph
            </div>
          </div>
          <div 
            className="bg-white/20 rounded-xl text-center"
            style={{ padding: 'clamp(8px, 1.5vw, 12px)' }}
          >
            <Droplets 
              className="mx-auto text-gray-600 mb-1" 
              style={{ width: 'clamp(14px, 2vw, 16px)', height: 'clamp(14px, 2vw, 16px)' }}
            />
            <div 
              className="text-gray-500"
              style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
            >
              Humidity
            </div>
            <div 
              className="font-semibold text-gray-800"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
            >
              {weather.humidity}%
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div 
        className="flex-1 flex flex-col"
        style={{ gap: 'clamp(12px, 3vw, 16px)' }}
      >
        {/* Hourly forecast */}
        <div 
          className="bg-white/10 rounded-2xl"
          style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
        >
          <h3 
            className="font-semibold text-gray-600 uppercase tracking-wide mb-3"
            style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', marginBottom: 'clamp(8px, 2vw, 12px)' }}
          >
            Hourly Forecast
          </h3>
          <div 
            className="flex justify-between overflow-x-auto"
            style={{ gap: 'clamp(4px, 1vw, 8px)' }}
          >
            {weather.hourly.map((hour, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center"
                style={{ minWidth: 'clamp(35px, 8vw, 45px)' }}
              >
                <span 
                  className="text-gray-500 mb-1"
                  style={{ fontSize: 'clamp(0.5rem, 1.2vw, 0.625rem)' }}
                >
                  {hour.time}
                </span>
                <WeatherIcon 
                  type={hour.icon} 
                  className="text-yellow-400 mb-1"
                  style={{ width: 'clamp(16px, 3vw, 20px)', height: 'clamp(16px, 3vw, 20px)' }}
                />
                <span 
                  className="font-semibold text-gray-800"
                  style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
                >
                  {hour.temp}°
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily forecast */}
        <div 
          className="bg-white/10 rounded-2xl flex-1"
          style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
        >
          <h3 
            className="font-semibold text-gray-600 uppercase tracking-wide mb-3"
            style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', marginBottom: 'clamp(8px, 2vw, 12px)' }}
          >
            7-Day Forecast
          </h3>
          <div style={{ gap: 'clamp(4px, 1vw, 8px)' }} className="space-y-2">
            {weather.forecast.map((day, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between border-b border-white/10 last:border-0"
                style={{ 
                  paddingTop: 'clamp(4px, 1vw, 8px)',
                  paddingBottom: 'clamp(4px, 1vw, 8px)'
                }}
              >
                <span 
                  className="text-gray-700"
                  style={{ 
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    width: 'clamp(36px, 8vw, 48px)'
                  }}
                >
                  {day.day}
                </span>
                <WeatherIcon 
                  type={day.icon} 
                  className="text-yellow-400"
                  style={{ width: 'clamp(16px, 3vw, 20px)', height: 'clamp(16px, 3vw, 20px)' }}
                />
                <div 
                  className="flex"
                  style={{ 
                    gap: 'clamp(4px, 1vw, 8px)',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }}
                >
                  <span className="text-gray-800 font-medium">{day.temp}°</span>
                  <span className="text-gray-500">{day.low || day.temp - 8}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Panel Component - matches contact.jsx exactly
function MessagePanel({ onClose, visionOSPanelStyle, isMobile }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('9h7WZUCDkTZScTuFO');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await emailjs.send(
        'service_0fqtjbj',      
        'template_rk6rqhn',     
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        }
      );
  
      console.log('Email sent successfully:', result);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Email error:', error);
      alert('❌ Failed to send message. Please try again or email me directly at jijunnie2113@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      value: 'jijunnie2113@gmail.com',
      link: 'mailto:jijunnie2113@gmail.com',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (754)610-4078',
      link: 'tel:+17546104078',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const socialLinks = [
    { icon: Linkedin, url: 'https://www.linkedin.com/in/jijun-nie-0aa297345/', label: 'LinkedIn', color: '#0A66C2' },
    { icon: Github, url: 'https://github.com/jijunnie', label: 'GitHub', color: '#171515' },
    { icon: Instagram, url: 'https://www.instagram.com/jijun_nie/', label: 'Instagram', color: '#E4405F' },
    { icon: MessageSquare, url: 'https://discord.com/users/jijunnie', label: 'Discord', color: '#5865F2' }
  ];

  return (
    <div className="h-full flex flex-col" style={{ overflow: 'visible' }}>
      {/* Header */}
      <div className="text-center flex-shrink-0" style={{ marginBottom: 'clamp(4px, 1.2vw, 8px)' }}>
        <h2 
          className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
          style={{ fontSize: isMobile ? 'clamp(1.125rem, 4vw, 1.5rem)' : 'clamp(0.875rem, 3.5vw, 1.25rem)' }}
        >
          Let's Connect
        </h2>
        <p 
          className="text-gray-600"
          style={{ 
            fontSize: isMobile ? 'clamp(0.75rem, 2.2vw, 0.9375rem)' : 'clamp(0.625rem, 1.8vw, 0.75rem)',
            marginTop: 'clamp(2px, 0.4vw, 3px)'
          }}
        >
          Have a project in mind? Let's create something amazing.
        </p>
      </div>

      {submitted ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-sm md:text-base">Message Sent! ✨</p>
            <p className="text-gray-500 text-xs md:text-sm">I'll get back to you soon.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0, gap: isMobile ? 'clamp(6px, 1.5vw, 8px)' : 'clamp(4px, 1vw, 6px)' }}>
          {/* Contact Form - Optimized for mobile */}
          <form 
            onSubmit={handleSubmit} 
            className="flex flex-col flex-shrink-0"
            style={{ gap: isMobile ? 'clamp(6px, 1.5vw, 8px)' : 'clamp(4px, 1.2vw, 8px)' }}
          >
            <div 
              className={isMobile ? "flex flex-col" : "grid grid-cols-2"}
              style={{ gap: isMobile ? 'clamp(6px, 1.5vw, 8px)' : 'clamp(4px, 1.2vw, 8px)' }}
            >
              <div className="flex-shrink-0">
                <label 
                  htmlFor="name" 
                  className="block text-gray-700 font-medium"
                  style={{ 
                    fontSize: isMobile ? 'clamp(0.6875rem, 1.8vw, 0.75rem)' : 'clamp(0.625rem, 1.6vw, 0.7rem)',
                    marginBottom: isMobile ? 'clamp(3px, 0.8vw, 4px)' : 'clamp(2px, 0.6vw, 4px)'
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl md:rounded-lg bg-white/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                  style={{
                    padding: isMobile ? 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)' : 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px)',
                    fontSize: isMobile ? 'clamp(0.875rem, 2.5vw, 1rem)' : 'clamp(0.8125rem, 2.2vw, 0.9375rem)'
                  }}
                />
              </div>
              <div className="flex-shrink-0">
                <label 
                  htmlFor="email" 
                  className="block text-gray-700 font-medium"
                  style={{ 
                    fontSize: isMobile ? 'clamp(0.6875rem, 1.8vw, 0.75rem)' : 'clamp(0.625rem, 1.6vw, 0.7rem)',
                    marginBottom: isMobile ? 'clamp(3px, 0.8vw, 4px)' : 'clamp(2px, 0.6vw, 4px)'
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl md:rounded-lg bg-white/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="email@example.com"
                  style={{
                    padding: isMobile ? 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)' : 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px)',
                    fontSize: isMobile ? 'clamp(0.875rem, 2.5vw, 1rem)' : 'clamp(0.8125rem, 2.2vw, 0.9375rem)'
                  }}
                />
              </div>
            </div>

            <div className="flex-shrink-0">
              <label 
                htmlFor="message" 
                className="block text-gray-700 font-medium"
                style={{ 
                  fontSize: isMobile ? 'clamp(0.6875rem, 1.8vw, 0.75rem)' : 'clamp(0.625rem, 1.6vw, 0.7rem)',
                  marginBottom: isMobile ? 'clamp(3px, 0.8vw, 4px)' : 'clamp(2px, 0.6vw, 4px)'
                }}
              >
                Message
              </label>
              <textarea
                id="message"
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full rounded-xl md:rounded-lg bg-white/50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Tell me about your project..."
                style={{
                  height: isMobile ? 'clamp(70px, 12vh, 90px)' : 'clamp(60px, 10vh, 80px)',
                  padding: isMobile ? 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)' : 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px)',
                  fontSize: isMobile ? 'clamp(0.875rem, 2.5vw, 1rem)' : 'clamp(0.8125rem, 2.2vw, 0.9375rem)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl md:rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              style={{
                padding: isMobile ? 'clamp(8px, 2vw, 10px)' : 'clamp(6px, 1.5vw, 10px)',
                fontSize: isMobile ? 'clamp(0.875rem, 2.5vw, 1rem)' : 'clamp(0.8125rem, 2.2vw, 0.9375rem)',
                gap: 'clamp(4px, 1vw, 6px)'
              }}
            >
              {isSubmitting ? (
                <>
                  <div 
                    className="border-2 border-white/30 border-t-white rounded-full animate-spin"
                    style={{ width: 'clamp(12px, 2.5vw, 16px)', height: 'clamp(12px, 2.5vw, 16px)' }}
                  />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send style={{ width: 'clamp(12px, 2.5vw, 16px)', height: 'clamp(12px, 2.5vw, 16px)' }} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Contact & Social Links - Redesigned for mobile */}
          <div 
            className="flex-shrink-0"
            style={{
              paddingTop: isMobile ? 'clamp(4px, 1vw, 6px)' : 'clamp(4px, 1vw, 6px)',
              paddingBottom: isMobile ? 'clamp(2px, 0.5vw, 3px)' : 'clamp(2px, 0.4vw, 3px)'
            }}
          >
            {isMobile ? (
              // Mobile: Single column, compact layout
              <div className="flex flex-col" style={{ gap: 'clamp(6px, 1.5vw, 8px)' }}>
                {/* Quick Contact - Horizontal on mobile */}
                <div className="flex-shrink-0">
                  <h4 
                    className="font-semibold text-gray-600"
                    style={{ 
                      fontSize: 'clamp(0.6875rem, 1.8vw, 0.75rem)',
                      marginBottom: 'clamp(4px, 1vw, 5px)'
                    }}
                  >
                    Quick Contact
                  </h4>
                  <div 
                    className="flex flex-col"
                    style={{ gap: 'clamp(6px, 1.5vw, 8px)' }}
                  >
                    {contactMethods.map((method, index) => {
                      const Icon = method.icon;
                      const isExternal = !method.link.startsWith('mailto:') && !method.link.startsWith('tel:');
                      return (
                        <a
                          key={index}
                          href={method.link}
                          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className="group flex items-center bg-white/30 hover:bg-white/50 rounded-xl transition-all duration-300 hover:scale-[1.02] border border-white/20 flex-shrink-0 w-full"
                          style={{
                            gap: 'clamp(6px, 1.5vw, 8px)',
                            padding: 'clamp(8px, 2vw, 10px)'
                          }}
                        >
                          <div 
                            className={`rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center flex-shrink-0`}
                            style={{ 
                              width: 'clamp(28px, 7vw, 32px)', 
                              height: 'clamp(28px, 7vw, 32px)' 
                            }}
                          >
                            <Icon 
                              className="text-white" 
                              style={{ 
                                width: 'clamp(14px, 3.5vw, 16px)', 
                                height: 'clamp(14px, 3.5vw, 16px)' 
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p 
                              className="font-medium text-gray-700 truncate"
                              style={{ fontSize: 'clamp(0.6875rem, 1.8vw, 0.75rem)' }}
                            >
                              {method.title}
                            </p>
                            <p 
                              className="text-gray-500 truncate"
                              style={{ fontSize: 'clamp(0.5625rem, 1.5vw, 0.625rem)' }}
                            >
                              {method.value}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Social Links - Grid on mobile */}
                <div className="flex-shrink-0">
                  <h4 
                    className="font-semibold text-gray-600"
                    style={{ 
                      fontSize: 'clamp(0.6875rem, 1.8vw, 0.75rem)',
                      marginBottom: 'clamp(4px, 1vw, 5px)'
                    }}
                  >
                    Follow Me
                  </h4>
                  <div 
                    className="grid grid-cols-4"
                    style={{ gap: 'clamp(6px, 1.5vw, 8px)' }}
                  >
                    {socialLinks.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          className="group bg-white/40 hover:bg-white/60 rounded-xl flex flex-col items-center justify-center border border-gray-200/50 transition-all duration-300 hover:scale-[1.02] hover:border-purple-400 hover:shadow-md flex-shrink-0"
                          style={{
                            padding: 'clamp(8px, 2vw, 10px)'
                          }}
                        >
                          <Icon 
                            className="transition-colors" 
                            style={{ 
                              color: social.color,
                              width: 'clamp(20px, 5vw, 24px)',
                              height: 'clamp(20px, 5vw, 24px)'
                            }}
                          />
                          <span 
                            className="text-gray-600 text-center"
                            style={{ 
                              fontSize: 'clamp(0.5625rem, 1.5vw, 0.625rem)',
                              marginTop: 'clamp(4px, 1vw, 5px)'
                            }}
                          >
                            {social.label}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Desktop: Two column layout
              <>
                <div className="border-t border-white/20 mb-4"></div>
                <div 
                  className="grid grid-cols-2"
                  style={{ gap: 'clamp(4px, 1vw, 6px)' }}
                >
                  {/* Quick Contact Methods */}
                  <div className="flex-shrink-0">
                    <h4 
                      className="font-semibold text-gray-600"
                      style={{ 
                        fontSize: 'clamp(0.625rem, 1.6vw, 0.7rem)',
                        marginBottom: 'clamp(3px, 0.8vw, 4px)'
                      }}
                    >
                      Quick Contact
                    </h4>
                    <div 
                      className="flex flex-col space-y-1"
                      style={{ gap: 'clamp(3px, 0.8vw, 5px)' }}
                    >
                      {contactMethods.map((method, index) => {
                        const Icon = method.icon;
                        const isExternal = !method.link.startsWith('mailto:') && !method.link.startsWith('tel:');
                        return (
                          <a
                            key={index}
                            href={method.link}
                            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="group flex items-center bg-white/30 hover:bg-white/50 rounded-lg transition-all duration-300 hover:scale-[1.02] border border-white/20 h-[50px] flex-shrink-0"
                            style={{
                              gap: 'clamp(3px, 0.8vw, 5px)',
                              padding: 'clamp(4px, 1.2vw, 8px)'
                            }}
                          >
                            <div 
                              className={`rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center flex-shrink-0`}
                              style={{ 
                                width: 'clamp(18px, 4.5vw, 24px)', 
                                height: 'clamp(18px, 4.5vw, 24px)' 
                              }}
                            >
                              <Icon 
                                className="text-white" 
                                style={{ 
                                  width: 'clamp(9px, 2.2vw, 12px)', 
                                  height: 'clamp(9px, 2.2vw, 12px)' 
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p 
                                className="font-medium text-gray-700 truncate"
                                style={{ fontSize: 'clamp(0.625rem, 1.6vw, 0.7rem)' }}
                              >
                                {method.title}
                              </p>
                              <p 
                                className="text-gray-500 truncate"
                                style={{ fontSize: 'clamp(0.5rem, 1.4vw, 0.6rem)' }}
                              >
                                {method.value}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex-shrink-0">
                    <h4 
                      className="font-semibold text-gray-600"
                      style={{ 
                        fontSize: 'clamp(0.625rem, 1.6vw, 0.7rem)',
                        marginBottom: 'clamp(3px, 0.8vw, 4px)'
                      }}
                    >
                      Follow Me
                    </h4>
                    <div 
                      className="grid grid-cols-2"
                      style={{ gap: 'clamp(3px, 0.8vw, 5px)' }}
                    >
                      {socialLinks.map((social, index) => {
                        const Icon = social.icon;
                        return (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className="group bg-white/40 hover:bg-white/60 rounded-lg flex flex-col items-center justify-center border border-gray-200/50 transition-all duration-300 hover:scale-[1.02] hover:border-purple-400 hover:shadow-md h-[50px] flex-shrink-0"
                            style={{
                              padding: 'clamp(4px, 1.2vw, 8px)'
                            }}
                          >
                            <Icon 
                              className="transition-colors" 
                              style={{ 
                                color: social.color,
                                width: 'clamp(14px, 3vw, 16px)',
                                height: 'clamp(14px, 3vw, 16px)'
                              }}
                            />
                            <span 
                              className="text-gray-600 text-center"
                              style={{ 
                                fontSize: 'clamp(0.5rem, 1.1vw, 0.55rem)',
                                marginTop: 'clamp(2px, 0.4vw, 3px)'
                              }}
                            >
                              {social.label}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Typing animation component with humanized pauses
function TypingMessage({ content, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const contentRef = useRef('');
  const hasCompletedRef = useRef(false);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    // If content hasn't changed, don't restart
    if (contentRef.current === content) {
      return;
    }
    
    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    if (!content || typeof content !== 'string') {
      console.warn('TypingMessage: Invalid content', content);
      return;
    }
    
    // Update ref to track current content
    const contentToType = String(content); // Ensure it's a string
    contentRef.current = contentToType;
    hasCompletedRef.current = false;
    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      // Use the ref value to ensure we're working with the correct content
      const currentContent = contentRef.current;
      
      // Check if content has changed (prevent continuing if content changed)
      if (currentContent !== contentToType) {
        console.log('TypingMessage: Content changed during typing, stopping');
        return;
      }
      
      if (currentIndex < currentContent.length) {
        const char = currentContent[currentIndex];
        setDisplayedText(currentContent.slice(0, currentIndex + 1));
        currentIndex++;
        
        // Determine delay based on character - optimized for faster, smoother experience
        let delay = 20; // Faster default typing speed: 20ms per character (reduced from 30ms)
        
        if (char === ',') {
          delay = 150; // Reduced pause for 150ms after comma (from 400ms)
        } else if (char === '.' || char === '!' || char === '?') {
          delay = 300; // Reduced pause for 300ms after sentence-ending punctuation (from 1200ms)
        }
        
        timeoutIdRef.current = setTimeout(typeNextCharacter, delay);
      } else {
        // Typing complete
        setIsTyping(false);
        hasCompletedRef.current = true;
        setDisplayedText(currentContent); // Ensure full content is displayed
        if (onComplete) {
          setTimeout(onComplete, 100);
        }
      }
    };
    
    // Start typing
    timeoutIdRef.current = setTimeout(typeNextCharacter, 30);
    
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [content, onComplete]);

  return (
    <>
      {displayedText}
      {isTyping && <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle">|</span>}
    </>
  );
}

// Thinking bubble component
function ThinkingBubble() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 6) return '.';
        return prev + '.';
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
}

// Jijun AI Panel - embedded chat experience similar to Home page
function JijunAIChatPanel({ isActive }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const chatContainerRef = useRef(null);
  
  const presetWelcomeMessage = "Hi, This is Jijun Nie. Ask me anything you wish to know about me.";
  
  // Show preset welcome message immediately when panel becomes active (before any user interaction)
  useEffect(() => {
    if (isActive && !welcomeShown) {
      setWelcomeShown(true);
      
      // Add preset welcome message immediately - show instantly without typing animation for better UX
      const welcomeId = 'initial';
      setMessages([{
        role: 'assistant',
        content: presetWelcomeMessage,
        id: welcomeId
      }]);
      
      // Don't start typing animation for welcome message - show it instantly
      // setTypingMessageId(welcomeId);
    } else if (!isActive) {
      // Reset when panel closes
      setWelcomeShown(false);
      setMessages([]);
      setTypingMessageId(null);
    }
  }, [isActive, welcomeShown]);

  // Auto-scroll to bottom only when response is generating (typing animation active or thinking bubble)
  useEffect(() => {
    if ((typingMessageId || isLoading) && chatContainerRef.current) {
      const interval = setInterval(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 200); // Update scroll every 200ms during typing/thinking to follow the animation

      return () => clearInterval(interval);
    }
  }, [typingMessageId, isLoading]);

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMessageId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: userMessageId }]);

    // Add thinking bubble
    const thinkingId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: thinkingId, isThinking: true }]);

    try {
      const systemPrompt = `You are Jijun Nie. Answer ONLY what the user asks in 1-2 short sentences. Be brief, friendly, and direct.
Quick facts (share only if relevant to their question):
- I'm 19 years old (do NOT mention exact birthday)
- UF Junior studying Industrial & System Engineering going in supply chain and logistic path(3.94 GPA)
- I spend free time learning new things on my own such as HTML/CSS, Data Analytics, Digital Marketing and more..
- I have certificate in Google Data Analytics, Google Project Management, Google Digital Marketing, Solidwork... 
- Work: Variantz Singapore (Web Design & Product Development Specialist - boosted traffic 400%), oversee two company website, 
- Also worked at Gou Lou Cheong Chinese BBQ as Server back in 2019-2024
- For school extracurricular activities, I am the President of Chinese Student Association(CSA) at UF leading 6 committes, 5 seasonal cultural events each with 300+ attendees. 
- Head Intern Leader at Variantz 
- Skills: JavaScript, Python, SQL, Matlab, R, SolidWorks, Google Workspace, Canva, SEO/SEM
- Languages: fluent in English, Mandarin, Cantonese
- Interests: Photography, Singing, Guitar, Badminton, Basketball, Gaming, Traveling
- Contact: jijun.nie@ufl.edu, (754) 610-4078
IMPORTANT RULES:
- Only answer the specific question asked
- Keep responses to 1-2 sentences maximum
- Don't volunteer extra information unless directly asked
- Be conversational and natural
- Use "I" not "Jijun"
- Add emojis sparingly (only when it feels natural)
- You must not say you are AI assistant, you are Jijun Nie
- If asked about age or birthday, just say "I'm 19 years old" - do NOT give the exact date`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || 
        "I'm not sure how to respond to that. Feel free to ask me something else!";

      // Log the full response for debugging
      console.log('Full AI response received:', aiResponse);
      console.log('Response length:', aiResponse.length);
      console.log('Stop reason:', data.stop_reason);

      // Remove thinking bubble and add response with typing animation
      const responseId = `response-${Date.now()}`;
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingId);
        return [...filtered, { role: 'assistant', content: aiResponse, id: responseId }];
      });
      
      // Start typing animation for this message
      setTypingMessageId(responseId);
    } catch (error) {
      console.error('Chat error details:', error);
      const errorId = `error-${Date.now()}`;
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingId);
        return [...filtered, { 
          role: 'assistant', 
          content: "Oops, something went wrong on my side. Please try again in a moment.",
          id: errorId
        }];
      });
      setTypingMessageId(errorId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4">
      {/* Header */}
      <div className="text-center flex-shrink-0">
        <h2 className="text-lg md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          Jijun AI
        </h2>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          A conversational version of me. Ask about my story, skills, or anything you're curious about.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-2xl bg-white/40 border border-white/40 shadow-inner overflow-hidden backdrop-blur-md">
        <div ref={chatContainerRef} className="h-full overflow-y-auto p-3 md:p-4 space-y-3">
          {messages.map((msg, index) => {
            const isTyping = msg.id === typingMessageId;
            const isThinking = msg.isThinking;
            
            return (
              <div
                key={msg.id || index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 text-xs md:text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                      : 'bg-white/80 text-gray-800 shadow-sm border border-white/60'}
                  `}
                >
                  {isThinking ? (
                    <ThinkingBubble />
                  ) : isTyping ? (
                    <TypingMessage 
                      content={msg.content}
                      onComplete={() => {
                        setTypingMessageId(null);
                        // Scroll to bottom when typing completes
                        if (chatContainerRef.current) {
                          setTimeout(() => {
                            if (chatContainerRef.current) {
                              chatContainerRef.current.scrollTo({
                                top: chatContainerRef.current.scrollHeight,
                                behavior: 'smooth'
                              });
                            }
                          }, 100);
                        }
                      }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-400 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm md:shadow-md transition-all duration-300"
          style={{
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '1px solid transparent',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-3 md:px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-purple-300/50 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md group overflow-hidden flex items-center justify-center"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-1">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden md:inline text-sm">Send</span>
          </span>
        </button>
      </form>
    </div>
  );
}

// Settings Panel Component - Apple-style two-column layout
function SettingsPanel({ isMobile, settings, updateSetting }) {
  const [activeTab, setActiveTab] = useState('music');

  const settingsTabs = [
    { id: 'music', label: 'Music', icon: Music },
    { id: 'background', label: 'Background', icon: Image },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'music':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Music Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Enable Background Music</p>
                      <p className="text-xs text-gray-500">Play ambient background music while browsing. Music will loop automatically and respect your volume setting.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.music.enabled}
                      onChange={(e) => updateSetting('music', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {settings.music.enabled && (
                  <div className="p-4 bg-white/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">Volume</p>
                      <span className="text-xs text-gray-600">{settings.music.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.music.volume}
                      onChange={(e) => updateSetting('music', 'volume', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'background':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Background Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Blur Intensity</p>
                      <p className="text-xs text-gray-500">Control the blur effect on background decorative elements (colored blobs). Higher values create a more dreamy, soft appearance. Range: 0-20px.</p>
                    </div>
                    <span className="text-xs text-gray-600">{settings.background.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.background.blur}
                    onChange={(e) => updateSetting('background', 'blur', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Brightness</p>
                      <p className="text-xs text-gray-500">Adjust the overall brightness of background elements. Lower values (50-80%) create a darker, more subdued look. Higher values (120-150%) make everything brighter. Range: 50-150%.</p>
                    </div>
                    <span className="text-xs text-gray-600">{settings.background.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={settings.background.brightness}
                    onChange={(e) => updateSetting('background', 'brightness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-800 mb-1">Theme</p>
                    <p className="text-xs text-gray-500">Choose your preferred color theme. Light uses bright colors, Dark uses darker tones, and Auto follows your system preference.</p>
                  </div>
                  <div className="flex gap-3 mt-3">
                    {['light', 'auto', 'dark'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateSetting('appearance', 'theme', theme)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          settings.appearance.theme === theme
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/80 text-gray-700 hover:bg-white'
                        }`}
                      >
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Animations</p>
                      <p className="text-xs text-gray-500">Toggle smooth animations and transitions throughout the portfolio. Disabling can improve performance on slower devices and reduce motion for accessibility.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => updateSetting('appearance', 'animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-lg md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          Settings
        </h2>
      </div>

      <div className={`flex-1 flex gap-4 overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
        {/* Left sidebar - 20% width on desktop, full width on mobile */}
        <div className={`${isMobile ? 'w-full border-b border-white/30 pb-4 mb-4' : 'w-[20%] border-r border-white/30 pr-4'} flex-shrink-0`}>
          <nav className={`${isMobile ? 'flex gap-2' : 'space-y-1'}`}>
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${isMobile ? 'flex-1' : 'w-full'} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content - 80% width on desktop, full width on mobile */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? '' : 'pr-2'}`}>
          {renderSettingsContent()}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [deviceOrientation, setDeviceOrientation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [activePanel, setActivePanel] = useState('icons');
  const [isReady, setIsReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  
  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('portfolioSettings');
    return saved ? JSON.parse(saved) : {
      music: { enabled: false, volume: 50 },
      background: { blur: 0, brightness: 100 },
      appearance: { theme: 'light', animations: true }
    };
  });
  
  // Audio ref for background music
  const audioRef = useRef(null);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('portfolioSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Update setting function
  const updateSetting = useCallback((category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);
  
  // Handle music settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.music.volume / 100;
      if (settings.music.enabled) {
        audioRef.current.play().catch(err => {
          console.log('Music autoplay prevented:', err);
          // User interaction required for autoplay
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [settings.music.enabled, settings.music.volume]);
  
  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.appearance.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // Auto - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [settings.appearance.theme]);
  
  const orientationRef = useRef({ x: 0, y: 0 });
  const smoothedOrientationRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const lastOrientationUpdate = useRef(0);
  
  // Smooth interpolation for mouse position
  const smoothMousePos = useRef({ x: 0, y: 0 });
  const targetMousePos = useRef({ x: 0, y: 0 });
  const mouseAnimationFrame = useRef(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const hoverTimeoutRef = useRef(null);
  const iconsPanelRef = useRef(null);
  
  // Smooth combined spatial position for stability
  const smoothedSpatialPos = useRef({ x: 0, y: 0 });
  const lastSpatialPosRef = useRef({ x: 0, y: 0 });
  const [spatialPos, setSpatialPos] = useState({ x: 0, y: 0 });

  // Preload all GLB files on component mount
  useEffect(() => {
    // Preload all icon GLB files
    const iconFiles = [
      '/icons/weather.glb',
      '/icons/message.glb',
      '/icons/clock.glb',
      '/icons/file.glb',
      '/icons/music.glb',
      '/icons/photo.glb',
      '/icons/video.glb',
      '/icons/safari.glb',
      '/icons/setting.glb',
      '/icons/findmy.glb'
    ];

    // Preload all icons
    iconFiles.forEach((url) => {
      try {
        useGLTF.preload(url);
        console.log('✅ Preloaded icon:', url);
      } catch (error) {
        console.warn('⚠️ Failed to preload icon:', url, error);
      }
    });

    // Preload 3D background model (from CDN)
    const backgroundModelUrl = 'https://pub-d25f02af88d94b5cb8a6754606bd5ea1.r2.dev/cozy_living_room_baked.glb';
    try {
      useGLTF.preload(backgroundModelUrl);
      console.log('✅ Preloaded 3D background:', backgroundModelUrl);
    } catch (error) {
      console.warn('⚠️ Failed to preload 3D background:', backgroundModelUrl, error);
    }
  }, []);

  const panelOrder = ['calendar', 'icons', 'weather'];

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile || isTransitioning || expandedApp) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = panelOrder.indexOf(activePanel);
      
      if (deltaX < 0 && currentIndex < panelOrder.length - 1) {
        setIsTransitioning(true);
        setActivePanel(panelOrder[currentIndex + 1]);
        setTimeout(() => setIsTransitioning(false), 500);
      } else if (deltaX > 0 && currentIndex > 0) {
        setIsTransitioning(true);
        setActivePanel(panelOrder[currentIndex - 1]);
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }
  }, [isMobile, isTransitioning, activePanel, panelOrder, expandedApp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      const initialPos = { x: 0.001, y: 0.001 };
      setMousePos(initialPos);
      smoothMousePos.current = initialPos;
      lastMousePosRef.current = initialPos;
    }, 100);
    return () => {
      clearTimeout(timer);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile/tablet devices (including iPad)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      // iPad detection: check for iPad user agent or touch device with larger screen
      const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (isTouchDevice && window.innerWidth >= 768 && window.innerWidth <= 1024);
      setIsMobile(isSmallScreen || isIPad);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const requestOrientationPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        // iOS 13+ requires permission request
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission();
            setHasOrientationPermission(permission === 'granted');
          } catch (error) {
            console.log('Orientation permission error:', error);
            setHasOrientationPermission(false);
          }
        } else {
          // Older iOS or Android: no permission needed
          setHasOrientationPermission(true);
        }
      } else {
        // Device orientation not supported
        setHasOrientationPermission(false);
      }
    };

    // Request permission for mobile/iPad devices
    if (isMobile) {
      requestOrientationPermission();
    } else {
      // Desktop: no device orientation needed
      setHasOrientationPermission(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !hasOrientationPermission) return;

    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;

      // Clamp raw values first
      const rawX = Math.max(-1, Math.min(1, gamma / 30));
      const rawY = Math.max(-1, Math.min(1, (beta - 45) / 30));

      // Apply exponential smoothing at source to prevent violent shaking
      const smoothingFactor = 0.25; // Lower = smoother (more aggressive)
      orientationRef.current = {
        x: smoothedOrientationRef.current.x + (rawX - smoothedOrientationRef.current.x) * smoothingFactor,
        y: smoothedOrientationRef.current.y + (rawY - smoothedOrientationRef.current.y) * smoothingFactor
      };
      
      // Update smoothed reference
      smoothedOrientationRef.current = orientationRef.current;
    };

    const updateOrientation = (timestamp) => {
      if (timestamp - lastOrientationUpdate.current >= 33) {
        const { x, y } = orientationRef.current;
        
        setDeviceOrientation(prev => {
          const dx = Math.abs(prev.x - x);
          const dy = Math.abs(prev.y - y);
          // Increased threshold to prevent micro-updates that cause shaking
          if (dx > 0.02 || dy > 0.02) {
            // Additional smoothing layer before setting state
            const stateSmoothing = 0.3;
            return {
              x: prev.x + (x - prev.x) * stateSmoothing,
              y: prev.y + (y - prev.y) * stateSmoothing
            };
          }
          return prev;
        });
        
        lastOrientationUpdate.current = timestamp;
      }
      
      animationFrameRef.current = requestAnimationFrame(updateOrientation);
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    animationFrameRef.current = requestAnimationFrame(updateOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile, hasOrientationPermission]);

  useEffect(() => {
    // Enable mouse movement on ALL screen sizes for spatial effects
    // Smooth interpolation function (lerp) - higher factor for more immediate response
    const lerp = (start, end, factor) => start + (end - start) * factor;
    
    const handleMouseMove = (e) => {
      const newX = (e.clientX / window.innerWidth - 0.5) * 2;
      const newY = (e.clientY / window.innerHeight - 0.5) * 2;
      
      targetMousePos.current = { x: newX, y: newY };
      
      // Start smooth animation loop if not already running
      if (!mouseAnimationFrame.current) {
        const animate = () => {
          // Much higher lerp factor (0.7) for immediate, responsive movement
          smoothMousePos.current = {
            x: lerp(smoothMousePos.current.x, targetMousePos.current.x, 0.7),
            y: lerp(smoothMousePos.current.y, targetMousePos.current.y, 0.7)
          };
          
          // Update state immediately with minimal threshold
          const dx = Math.abs(smoothMousePos.current.x - lastMousePosRef.current.x);
          const dy = Math.abs(smoothMousePos.current.y - lastMousePosRef.current.y);
          
          // Very low threshold for immediate updates
          if (dx > 0.001 || dy > 0.001) {
            lastMousePosRef.current = {
              x: smoothMousePos.current.x,
              y: smoothMousePos.current.y
            };
            setMousePos({ 
              x: smoothMousePos.current.x, 
              y: smoothMousePos.current.y 
            });
          }
          
          // Continue animation if there's still a difference
          const remainingDx = Math.abs(targetMousePos.current.x - smoothMousePos.current.x);
          const remainingDy = Math.abs(targetMousePos.current.y - smoothMousePos.current.y);
          
          if (remainingDx > 0.0001 || remainingDy > 0.0001) {
            mouseAnimationFrame.current = requestAnimationFrame(animate);
          } else {
            mouseAnimationFrame.current = null;
          }
        };
        
        mouseAnimationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseAnimationFrame.current) {
        cancelAnimationFrame(mouseAnimationFrame.current);
        mouseAnimationFrame.current = null;
      }
    };
  }, []);

  // Combine mouse and device orientation for smooth spatial effects
  // For ALL screen sizes: use mouse movement for spatial effects
  // On iPad/mobile ONLY: add device orientation to mouse movement
  // Smoothly combine mouse and device orientation for stable spatial effects
  useEffect(() => {
    const updateSpatialPos = () => {
      let targetPos;
      
      if (isMobile && hasOrientationPermission) {
        // On mobile/iPad: combine both inputs with smooth blending
        // Weight: 60% device orientation, 40% mouse (device orientation is more prominent on mobile)
        targetPos = {
          x: deviceOrientation.x * 0.6 + mousePos.x * 0.4,
          y: deviceOrientation.y * 0.6 + mousePos.y * 0.4
        };
      } else {
        // Desktop or mobile without orientation: use mouse only (works for all screen sizes)
        targetPos = mousePos;
      }
      
      // Smooth interpolation for stability (lerp factor: 0.3 for smooth, stable movement)
      const lerpFactor = 0.3;
      smoothedSpatialPos.current = {
        x: smoothedSpatialPos.current.x + (targetPos.x - smoothedSpatialPos.current.x) * lerpFactor,
        y: smoothedSpatialPos.current.y + (targetPos.y - smoothedSpatialPos.current.y) * lerpFactor
      };
      
      // Update state with threshold to prevent micro-updates
      const dx = Math.abs(smoothedSpatialPos.current.x - lastSpatialPosRef.current.x);
      const dy = Math.abs(smoothedSpatialPos.current.y - lastSpatialPosRef.current.y);
      
      if (dx > 0.001 || dy > 0.001) {
        lastSpatialPosRef.current = {
          x: smoothedSpatialPos.current.x,
          y: smoothedSpatialPos.current.y
        };
        setSpatialPos({
          x: smoothedSpatialPos.current.x,
          y: smoothedSpatialPos.current.y
        });
      }
    };
    
    const interval = setInterval(updateSpatialPos, 16); // ~60fps updates
    updateSpatialPos(); // Initial update
    
    return () => clearInterval(interval);
  }, [isMobile, hasOrientationPermission, deviceOrientation, mousePos]);

  const icons = useMemo(() => [
    { type: 'glb', src: '/icons/weather.glb', label: 'Weather', depth: 1.4, scale: 0.475, action: 'weather' },
    { type: 'glb', src: '/icons/message.glb', label: 'Messages', depth: 1.5, scale: 0.48, action: 'messages' },
    { type: 'glb', src: '/icons/clock.glb', label: 'Clock', depth: 1.2, scale: 0.485, action: 'clock' },
    { type: 'glb', src: '/icons/file.glb', label: 'My Projects', depth: 1.2, scale: 0.48 },
    { type: 'glb', src: '/icons/music.glb', label: 'My Musics', depth: 1.3, scale: 0.48 },
    { type: 'glb', src: '/icons/photo.glb', label: 'My Photographies', depth: 1.3, scale: 0.5 },
    { type: 'glb', src: '/icons/video.glb', label: 'My Videographies', depth: 1.5, scale: 3 },
    { type: 'glb', src: '/icons/safari.glb', label: 'Jijun AI', depth: 1.4, scale: 0.5, action: 'ai' },
    { type: 'glb', src: '/icons/setting.glb', label: 'Settings', depth: 1.2, scale: 0.47, action: 'settings' },
    { type: 'glb', src: '/icons/findmy.glb', label: 'Find My', depth: 1.3, scale: 0.5 },
  ], []);

  const handleIconClick = useCallback((index) => {
    const icon = icons[index];
    console.log('Icon clicked:', icon.label, 'action:', icon.action);
    if (icon.action) {
      console.log('Expanding app:', icon.action);
      setIsTransitioning(true);
      setExpandedApp(icon.action);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  }, [icons]);

  const closeExpandedApp = useCallback(() => {
    setIsTransitioning(true);
    setExpandedApp(null);
    setTimeout(() => setIsTransitioning(false), 600);
  }, []);

  const getTransform = useCallback((depth) => {
    const pos = spatialPos;
    // More precise rounding to reduce flickering while maintaining smoothness
    const rotateX = Math.round((-pos.y * 8 * depth) * 1000) / 1000;
    const rotateY = Math.round((pos.x * 8 * depth) * 1000) / 1000;
    const translateZ = Math.round(depth * 10 * 100) / 100;
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
  }, [spatialPos]);

  const iconPositions = useMemo(() => [
    { x: '25%', y: isMobile ? '18%' : '20%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '50%', y: isMobile ? '18%' : '20%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '75%', y: isMobile ? '18%' : '20%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '12%', y: isMobile ? '45%' : '50%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '37%', y: isMobile ? '45%' : '50%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '63%', y: isMobile ? '45%' : '50%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '88%', y: isMobile ? '45%' : '50%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '25%', y: isMobile ? '72%' : '80%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '50%', y: isMobile ? '72%' : '80%', size: 'clamp(100px, 13vw, 140px)' },
    { x: '75%', y: isMobile ? '72%' : '80%', size: 'clamp(100px, 13vw, 140px)' },
  ], [isMobile]);

  const positionsArray = useMemo(() => [
    { x: 0.25, y: 0.20 },
    { x: 0.50, y: 0.20 },
    { x: 0.75, y: 0.20 },
    { x: 0.12, y: 0.50 },
    { x: 0.37, y: 0.50 },
    { x: 0.63, y: 0.50 },
    { x: 0.88, y: 0.50 },
    { x: 0.25, y: 0.80 },
    { x: 0.50, y: 0.80 },
    { x: 0.75, y: 0.80 },
  ], []);

  const getIconTransform = useCallback((index, depth) => {
    const pos = spatialPos;
    // More precise rounding for smoother movement
    const offsetX = Math.round((pos.x * 20 * depth) * 1000) / 1000;
    const offsetY = Math.round((pos.y * 20 * depth) * 1000) / 1000;

    if (isHovered !== null) {
      if (isHovered === index) {
        return `translate(${offsetX}px, ${offsetY}px) scale(1.25)`;
      } else {
        const currentPos = positionsArray[index];
        const hoveredPos = positionsArray[isHovered];
        const dx = currentPos.x - hoveredPos.x;
        const dy = currentPos.y - hoveredPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pushDistance = Math.max(0, 60 - distance * 150);
        const pushX = Math.round(((dx / (distance || 1)) * pushDistance) * 1000) / 1000;
        const pushY = Math.round(((dy / (distance || 1)) * pushDistance) * 1000) / 1000;
        return `translate(${offsetX + pushX}px, ${offsetY + pushY}px) scale(0.9)`;
      }
    }
    return `translate(${offsetX}px, ${offsetY}px) scale(1)`;
  }, [spatialPos, isHovered, positionsArray]);

  const visionOSPanelStyle = useMemo(() => ({
    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 100%)',
    backdropFilter: 'blur(120px) saturate(200%)',
    WebkitBackdropFilter: 'blur(120px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: `
      0 8px 32px rgba(0,0,0,0.12),
      0 2px 8px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.5),
      inset 0 -1px 0 rgba(255,255,255,0.15)
    `
  }), []);

  const expandedPanelStyle = useMemo(() => ({
    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 100%)',
    backdropFilter: 'blur(140px) saturate(220%)',
    WebkitBackdropFilter: 'blur(140px) saturate(220%)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: `
      0 8px 32px rgba(0,0,0,0.15),
      0 2px 8px rgba(0,0,0,0.1),
      inset 0 1px 0 rgba(255,255,255,0.4),
      inset 0 -1px 0 rgba(255,255,255,0.1)
    `
  }), []);

  const visionOSTransition = useMemo(() => {
    if (!settings.appearance.animations) {
      return 'none';
    }
    return isTransitioning 
      ? 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)'
      : 'transform 0.1s ease-out, filter 0.2s ease-out, opacity 0.2s ease-out';
  }, [isTransitioning, settings.appearance.animations]);

  const getBlurStyle = useCallback((panelType) => {
    if (expandedApp) {
      return {
        filter: 'blur(5px)',
      };
    }
    if (!isMobile) return {};
    const isActive = activePanel === panelType;
    
    // When icons panel is active, reduce blur on calendar and weather panels
    if (activePanel === 'icons' && (panelType === 'calendar' || panelType === 'weather')) {
      return {
        filter: 'blur(2px)', // Less blurred when icons panel is in front
      };
    }
    
    return {
      filter: isActive ? 'blur(0px)' : 'blur(4px)',
    };
  }, [isMobile, activePanel, expandedApp]);

  const getCalendarPanelStyle = useCallback(() => {
    if (expandedApp) {
      if (!isMobile) {
        // Desktop: keep panel in place but blurred
        return {
          left: 'clamp(40px, 8vw, 120px)',
          transform: `translateY(-50%) ${getTransform(0.6)}`,
          opacity: 0.5,
          zIndex: 30,
          pointerEvents: 'none'
        };
      } else {
        // Mobile: move panel off screen
        return {
          left: '50%',
          transform: 'translate(-200%, -50%) scale(0.5)',
          opacity: 0.5,
          zIndex: 30,
          pointerEvents: 'none'
        };
      }
    }
    
    if (!isMobile) {
      return {
        left: 'clamp(40px, 8vw, 120px)',
        transform: `translateY(-50%) ${getTransform(0.6)}`,
        zIndex: 10
      };
    }
    
    const isActive = activePanel === 'calendar';
    const spatialRotateX = isTransitioning ? 0 : -spatialPos.y * 5;
    const spatialRotateY = isTransitioning ? 0 : spatialPos.x * 5;
    
    return {
      left: '50%',
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
        : `translate(-120%, -50%) scale(0.85) rotateY(25deg)`,
      opacity: isActive ? 1 : 0.85,
      zIndex: isActive ? 30 : 5,
      pointerEvents: isActive ? 'auto' : 'none'
    };
  }, [isMobile, activePanel, spatialPos, getTransform, isTransitioning, expandedApp]);

  const getIconsPanelStyle = useCallback(() => {
    if (expandedApp === 'clock') {
      if (!isMobile) {
        // Desktop: keep panel in place but blurred
        return {
          transform: `translate(-50%, -50%) ${getTransform(0.5)}`,
          opacity: 0.5,
          zIndex: 20,
          pointerEvents: 'none'
        };
      } else {
        // Mobile: move panel off screen
        return {
          left: '50%',
          right: 'auto',
          transform: 'translate(200%, -50%) scale(0.5)',
          opacity: 0.5,
          zIndex: 20,
          pointerEvents: 'none'
        };
      }
    }
    if (expandedApp) {
      if (!isMobile) {
        // Desktop: keep panel in place but blurred
        return {
          transform: `translate(-50%, -50%) ${getTransform(0.5)}`,
          opacity: 0.5,
          zIndex: 20,
          pointerEvents: 'none'
        };
      } else {
        // Mobile: scale down panel
        return {
          transform: 'translate(-50%, -50%) scale(0.8)',
          opacity: 0.5,
          zIndex: 20,
          pointerEvents: 'none'
        };
      }
    }
    
    if (!isMobile) {
      return {
        transform: `translate(-50%, -50%) ${getTransform(0.5)}`,
        zIndex: 20,
        pointerEvents: 'auto'
      };
    }
    
    const isActive = activePanel === 'icons';
    const spatialRotateX = isTransitioning ? 0 : -spatialPos.y * 5;
    const spatialRotateY = isTransitioning ? 0 : spatialPos.x * 5;
    
    return {
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
        : 'translate(-50%, -50%) scale(0.85)',
      opacity: isActive ? 1 : 0.6,
      zIndex: isActive ? 30 : 10,
      pointerEvents: isActive ? 'auto' : 'none'
    };
  }, [isMobile, activePanel, spatialPos, getTransform, isTransitioning, expandedApp]);

  const getWeatherPanelStyle = useCallback(() => {
    if (expandedApp) {
      if (!isMobile) {
        // Desktop: keep panel in place but blurred
        return {
          right: 'clamp(40px, 8vw, 120px)',
          transform: `translateY(-50%) ${getTransform(0.6)}`,
          opacity: 0.5,
          zIndex: 30,
          pointerEvents: 'none'
        };
      } else {
        // Mobile: move panel off screen
        return {
          left: '50%',
          right: 'auto',
          transform: 'translate(100%, -50%) scale(0.5)',
          opacity: 0.5,
          zIndex: 30,
          pointerEvents: 'none'
        };
      }
    }
    
    if (!isMobile) {
      return {
        right: 'clamp(40px, 8vw, 120px)',
        transform: `translateY(-50%) ${getTransform(0.6)}`,
        zIndex: 10
      };
    }
    
    const isActive = activePanel === 'weather';
    const spatialRotateX = isTransitioning ? 0 : -spatialPos.y * 5;
    const spatialRotateY = isTransitioning ? 0 : spatialPos.x * 5;
    
    return {
      left: '50%',
      right: 'auto',
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
        : 'translate(20%, -50%) scale(0.85) rotateY(-25deg)',
      opacity: isActive ? 1 : 0.85,
      zIndex: isActive ? 30 : 5,
      pointerEvents: isActive ? 'auto' : 'none'
    };
  }, [isMobile, activePanel, spatialPos, getTransform, isTransitioning, expandedApp]);

  const getExpandedPanelStyle = useCallback((type) => {
    const isActive = expandedApp === type;
    const spatialRotateX = isTransitioning ? 0 : -spatialPos.y * 3;
    const spatialRotateY = isTransitioning ? 0 : spatialPos.x * 3;
    
    if (type === 'weather') {
      return {
        transform: isActive 
          ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
          : 'translate(100%, -50%) scale(0.8)',
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 50 : -1,
        pointerEvents: isActive ? 'auto' : 'none'
      };
    }
    
    if (type === 'messages') {
      return {
        transform: isActive 
          ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
          : 'translate(-50%, 100%) scale(0.8)',
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 50 : -1,
        pointerEvents: isActive ? 'auto' : 'none'
      };
    }
    
    if (type === 'clock') {
      return {
        transform: isActive 
          ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
          : 'translate(-200%, -50%) scale(0.8)',
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 50 : -1,
        pointerEvents: isActive ? 'auto' : 'none'
      };
    }
    
    if (type === 'ai') {
      return {
        transform: isActive 
          ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
          : 'translate(0, -150%) scale(0.8)',
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 50 : -1,
        pointerEvents: isActive ? 'auto' : 'none'
      };
    }
    
    if (type === 'settings') {
      return {
        transform: isActive 
          ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg)`
          : 'translate(150%, -50%) scale(0.8)',
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 50 : -1,
        pointerEvents: isActive ? 'auto' : 'none'
      };
    }
    
    
    return {};
  }, [expandedApp, spatialPos, isTransitioning]);

  const handlePanelClick = useCallback((panelType, e) => {
    if (e.target !== e.currentTarget && panelType === 'icons') {
      return;
    }
    
    if (isMobile && activePanel !== panelType && !expandedApp) {
      e.stopPropagation();
      setIsTransitioning(true);
      setActivePanel(panelType);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [isMobile, activePanel, expandedApp]);

  const handleBackgroundClick = useCallback((e) => {
    if (expandedApp) {
      if (e.target === e.currentTarget) {
        closeExpandedApp();
      }
      return;
    }
    
    if (isMobile && activePanel !== 'icons') {
      if (e.target === e.currentTarget) {
        setIsTransitioning(true);
        setActivePanel('icons');
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
      }
    }
  }, [isMobile, activePanel, expandedApp, closeExpandedApp]);

  return (
    <div 
      className="relative w-full h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-300 overflow-hidden"
      onClick={handleBackgroundClick}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Living Room 3D Background Model */}
      <LivingRoomBackground 
        spatialPos={spatialPos}
        isMobile={isMobile}
      />

      {/* Background Music */}
      {settings.music.enabled && (
        <audio
          ref={audioRef}
          loop
          preload="auto"
          style={{ display: 'none' }}
        >
          {/* You can add an actual music file here */}
          <source src="" type="audio/mpeg" />
        </audio>
      )}
      
      <div 
        className="absolute inset-0 pointer-events-none bg-blobs" 
        style={{ 
          transform: getTransform(0.3),
          willChange: 'transform',
          zIndex: 1,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          filter: `blur(${settings.background.blur}px) brightness(${settings.background.brightness}%)`,
          transition: settings.appearance.animations ? 'filter 0.3s ease-out' : 'none'
        }}
      >
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" 
          style={{ filter: `blur(3rem)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" 
          style={{ filter: `blur(3rem)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/20 rounded-full blur-3xl" 
          style={{ filter: `blur(3rem)` }}
        />
      </div>

      {isMobile && activePanel !== 'icons' && !expandedApp && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => {
            setIsTransitioning(true);
            setActivePanel('icons');
            setTimeout(() => setIsTransitioning(false), 500);
          }}
        />
      )}

      {expandedApp && (
        <div 
          className="absolute inset-0 z-40"
          onClick={closeExpandedApp}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            opacity: 1,
            transition: 'opacity 0.3s ease-out, backdrop-filter 0.3s ease-out',
            willChange: 'opacity'
          }}
        />
      )}

      {isMobile && activePanel === 'icons' && !expandedApp && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 w-16 z-25 flex items-center justify-start pl-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsTransitioning(true);
              setActivePanel('calendar');
              setTimeout(() => setIsTransitioning(false), 500);
            }}
          >
            <div className="w-1.5 h-20 rounded-full bg-white/30 backdrop-blur-sm shadow-lg" />
          </div>
          
          <div 
            className="absolute right-0 top-0 bottom-0 w-16 z-25 flex items-center justify-end pr-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsTransitioning(true);
              setActivePanel('weather');
              setTimeout(() => setIsTransitioning(false), 500);
            }}
          >
            <div className="w-1.5 h-20 rounded-full bg-white/30 backdrop-blur-sm shadow-lg" />
          </div>
        </>
      )}

      <div 
        className="absolute top-1/2 panel-container"
        style={{ 
          ...getCalendarPanelStyle(),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
          willChange: isTransitioning ? 'transform, opacity, filter' : 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        onClick={(e) => handlePanelClick('calendar', e)}
      >
        <div 
          className="rounded-3xl overflow-hidden cursor-pointer panel-inner relative"
          style={{ 
            width: isMobile ? 'clamp(260px, 75vw, 320px)' : 'clamp(180px, 18vw, 280px)',
            height: isMobile ? 'auto' : 'clamp(320px, 42vh, 480px)',
            maxHeight: isMobile ? 'clamp(340px, 60vh, 420px)' : 'none',
            transform: isMobile ? 'none' : 'rotateY(12deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Blurred background layer */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{ 
              ...visionOSPanelStyle,
              zIndex: 0
            }}
          />
          {/* Content layer - tiny blur */}
          <div 
            className="relative z-10 p-4 flex flex-col h-full"
            style={{ filter: 'blur(0.5px)' }}
          >
            <DateTimeDisplay />
            <CalendarWidget />
          </div>
        </div>
      </div>

      <div 
        ref={iconsPanelRef}
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getIconsPanelStyle(),
          ...getBlurStyle('icons'),
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          background: 'transparent',
          transformStyle: isMobile ? 'preserve-3d' : 'flat',
          transition: visionOSTransition,
          willChange: isTransitioning ? 'transform, opacity, filter' : 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        onClick={(e) => handlePanelClick('icons', e)}
        onMouseLeave={(e) => {
          // Clear hover when leaving the entire icons panel
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          const relatedTarget = e.relatedTarget;
          // Check if relatedTarget is a valid DOM element before calling closest
          if (!relatedTarget || !(relatedTarget instanceof Element) || !relatedTarget.closest('.icon-item')) {
            setIsHovered(null);
          }
        }}
      >
        <div 
          className="relative"
          style={{ 
            width: isMobile ? 'clamp(340px, 90vw, 420px)' : 'clamp(400px, 50vw, 600px)',
            height: isMobile ? 'clamp(280px, 48vh, 360px)' : 'clamp(350px, 55vh, 550px)'
          }}
        >
          {icons.map((item, index) => {
            const { src, label, depth, scale = 0.5, action } = item;
            const pos = iconPositions[index];
            const iconSize = isMobile ? 'clamp(90px, 22vw, 120px)' : pos.size;
            
            return (
              <div 
                key={index}
                className="absolute icon-item"
                style={{ 
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%, -50%) ${getIconTransform(index, depth)}`,
                  opacity: isHovered !== null && isHovered !== index ? 0.4 : 1,
                  zIndex: isHovered === index ? 100 : index + 1,
                  transition: 'opacity 0.05s linear, transform 0.1s ease-out',
                  willChange: 'transform, opacity',
                  cursor: action ? 'pointer' : 'default',
                  width: iconSize,
                  height: iconSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d'
                }}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                  setIsHovered(index);
                }}
                onMouseLeave={(e) => {
                  // Delay clearing hover to prevent flashing when moving to panel
                  hoverTimeoutRef.current = setTimeout(() => {
                    const relatedTarget = e.relatedTarget;
                    // Check if relatedTarget is a valid DOM element before calling closest
                    if (!relatedTarget || !(relatedTarget instanceof Element)) {
                      setIsHovered(null);
                      return;
                    }
                    // Only clear if not moving to another icon or panel
                    if (!relatedTarget.closest('.icon-item') && 
                        !relatedTarget.closest('.panel-container') &&
                        !relatedTarget.closest('.panel-inner')) {
                      setIsHovered(null);
                    }
                  }, 50);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Icon clicked:', label, 'action:', action);
                  if (action) {
                    setExpandedApp(action);
                  }
                }}
              >
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none',
                    overflow: 'visible'
                  }}
                >
                  <GLBIcon 
                    src={src} 
                    isHovered={isHovered === index} 
                    scale={scale} 
                    spatialPos={spatialPos}
                  />
                </div>
                
                <div 
                  className={`
                    absolute text-[11px] font-medium text-gray-700 
                    whitespace-nowrap text-center
                    transition-all duration-200 pointer-events-none
                    ${isHovered === index ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{
                    left: '50%',
                    top: isHovered === index ? '85%' : '95%',
                    marginTop: isHovered === index ? '0px' : '1px',
                    transform: 'translateX(-50%)',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                    width: 'max-content'
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div 
        className="absolute top-1/2 panel-container"
        style={{ 
          ...getWeatherPanelStyle(),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
          willChange: isTransitioning ? 'transform, opacity, filter' : 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        onClick={(e) => handlePanelClick('weather', e)}
      >
        <div 
          className="rounded-3xl overflow-hidden cursor-pointer panel-inner relative"
          style={{ 
            width: isMobile ? 'clamp(240px, 70vw, 300px)' : 'clamp(160px, 16vw, 240px)',
            height: isMobile ? 'auto' : 'clamp(320px, 42vh, 480px)',
            maxHeight: isMobile ? 'clamp(320px, 55vh, 400px)' : 'none',
            transform: isMobile ? 'none' : 'rotateY(-12deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Blurred background layer */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{ 
              ...visionOSPanelStyle,
              zIndex: 0
            }}
          />
          {/* Content layer - tiny blur */}
          <div 
            className="relative z-10 p-4 h-full overflow-hidden"
            style={{ filter: 'blur(0.5px)' }}
          >
            <WeatherWidget compact={true} />
          </div>
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getExpandedPanelStyle('weather'),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-3xl overflow-hidden panel-inner relative"
          style={{ 
            ...expandedPanelStyle,
            width: isMobile 
              ? 'clamp(300px, 92vw, 420px)' 
              : 'clamp(480px, min(65vw, 90vw - 80px), 800px)',
            height: isMobile 
              ? 'clamp(500px, 88vh, 680px)' 
              : 'clamp(450px, min(65vh, 90vh - 60px), 600px)',
            maxWidth: isMobile ? '92vw' : 'min(65vw, 90vw - 80px)',
            maxHeight: isMobile ? '88vh' : 'min(65vh, 90vh - 60px)',
            padding: isMobile ? 'clamp(12px, 3vw, 20px)' : 'clamp(20px, 2vw, 32px)',
          }}
        >
          <button
            onClick={closeExpandedApp}
            className="absolute z-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all"
            style={{
              top: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              right: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              width: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
              height: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
            }}
          >
            <X className="text-gray-700" style={{ width: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)', height: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)' }} />
          </button>
          
          <div className="h-full overflow-y-auto">
            <WeatherWidget compact={false} />
          </div>
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getExpandedPanelStyle('messages'),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-3xl panel-inner relative"
          style={{ 
            ...expandedPanelStyle,
            width: isMobile 
              ? 'clamp(300px, 92vw, 420px)' 
              : 'clamp(480px, min(65vw, 90vw - 80px), 800px)',
            height: isMobile 
              ? 'clamp(500px, 88vh, 680px)' 
              : 'clamp(450px, min(65vh, 90vh - 60px), 600px)',
            maxWidth: isMobile ? '92vw' : 'min(65vw, 90vw - 80px)',
            maxHeight: isMobile ? '88vh' : 'min(65vh, 90vh - 60px)',
            padding: isMobile ? 'clamp(12px, 3vw, 20px)' : 'clamp(20px, 2vw, 32px)',
            overflow: 'visible'
          }}
        >
          <button
            onClick={closeExpandedApp}
            className="absolute z-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all"
            style={{
              top: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              right: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              width: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
              height: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
            }}
          >
            <X className="text-gray-700" style={{ width: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)', height: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)' }} />
          </button>
          
          <MessagePanel onClose={closeExpandedApp} visionOSPanelStyle={expandedPanelStyle} isMobile={isMobile} />
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getExpandedPanelStyle('clock'),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-3xl overflow-hidden panel-inner relative"
          style={{ 
            ...expandedPanelStyle,
            width: isMobile 
              ? 'clamp(300px, 92vw, 420px)' 
              : 'clamp(480px, min(65vw, 90vw - 80px), 800px)',
            height: isMobile 
              ? 'clamp(500px, 88vh, 680px)' 
              : 'clamp(450px, min(65vh, 90vh - 60px), 600px)',
            maxWidth: isMobile ? '92vw' : 'min(65vw, 90vw - 80px)',
            maxHeight: isMobile ? '88vh' : 'min(65vh, 90vh - 60px)',
            padding: isMobile ? 'clamp(12px, 3vw, 20px)' : 'clamp(20px, 2vw, 32px)',
          }}
        >
          <button
            onClick={closeExpandedApp}
            className="absolute z-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all"
            style={{
              top: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              right: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              width: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
              height: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
            }}
          >
            <X className="text-gray-700" style={{ width: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)', height: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)' }} />
          </button>
          
          <ClockPanel />
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getExpandedPanelStyle('ai'),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-3xl panel-inner relative"
          style={{ 
            ...expandedPanelStyle,
            width: isMobile 
              ? 'clamp(300px, 92vw, 420px)' 
              : 'clamp(480px, min(65vw, 90vw - 80px), 800px)',
            height: isMobile 
              ? 'clamp(500px, 88vh, 680px)' 
              : 'clamp(450px, min(65vh, 90vh - 60px), 600px)',
            maxWidth: isMobile ? '92vw' : 'min(65vw, 90vw - 80px)',
            maxHeight: isMobile ? '88vh' : 'min(65vh, 90vh - 60px)',
            padding: isMobile ? 'clamp(12px, 3vw, 20px)' : 'clamp(20px, 2vw, 32px)',
            overflow: 'hidden'
          }}
        >
          <button
            onClick={closeExpandedApp}
            className="absolute z-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all"
            style={{
              top: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              right: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              width: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
              height: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
            }}
          >
            <X className="text-gray-700" style={{ width: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)', height: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)' }} />
          </button>
          
          <JijunAIChatPanel key={expandedApp === 'ai' ? 'ai-open' : 'ai-closed'} isActive={expandedApp === 'ai'} />
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2 panel-container"
        style={{
          ...getExpandedPanelStyle('settings'),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-3xl panel-inner relative"
          style={{ 
            ...expandedPanelStyle,
            width: isMobile 
              ? 'clamp(300px, 92vw, 420px)' 
              : 'clamp(600px, min(75vw, 90vw - 80px), 900px)',
            height: isMobile 
              ? 'clamp(500px, 88vh, 680px)' 
              : 'clamp(500px, min(70vh, 90vh - 60px), 650px)',
            maxWidth: isMobile ? '92vw' : 'min(75vw, 90vw - 80px)',
            maxHeight: isMobile ? '88vh' : 'min(70vh, 90vh - 60px)',
            padding: isMobile ? 'clamp(12px, 3vw, 20px)' : 'clamp(20px, 2vw, 32px)',
            overflow: 'hidden'
          }}
        >
          <button
            onClick={closeExpandedApp}
            className="absolute z-10 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all"
            style={{
              top: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              right: isMobile ? 'clamp(8px, 2vw, 12px)' : 'clamp(12px, 1.5vw, 16px)',
              width: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
              height: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(32px, 3vw, 40px)',
            }}
          >
            <X className="text-gray-700" style={{ width: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)', height: isMobile ? 'clamp(14px, 3.5vw, 18px)' : 'clamp(16px, 1.5vw, 20px)' }} />
          </button>
          
          <SettingsPanel isMobile={isMobile} settings={settings} updateSetting={updateSetting} />
        </div>
      </div>

      {isMobile && !expandedApp && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40">
          {[
            { id: 'calendar', label: 'Calendar' },
            { id: 'icons', label: 'Apps' },
            { id: 'weather', label: 'Weather' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                if (activePanel !== id) {
                  setIsTransitioning(true);
                  setActivePanel(id);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              className="flex flex-col items-center gap-1.5"
            >
              <div 
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${activePanel === id 
                    ? 'bg-gray-800 scale-125' 
                    : 'bg-gray-400/50'
                  }
                `}
                style={{
                  boxShadow: activePanel === id 
                    ? '0 0 12px rgba(0,0,0,0.3)' 
                    : 'none'
                }}
              />
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                activePanel === id ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}

      {isMobile && !hasOrientationPermission && typeof DeviceOrientationEvent !== 'undefined' && 
       typeof DeviceOrientationEvent.requestPermission === 'function' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={async () => {
              try {
                const permission = await DeviceOrientationEvent.requestPermission();
                setHasOrientationPermission(permission === 'granted');
              } catch (error) {
                console.log('Permission error:', error);
              }
            }}
            className="text-xs text-white px-4 py-2 rounded-full"
            style={{
              background: 'rgba(59, 130, 246, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            Enable Motion Effects
          </button>
        </div>
      )}

      {!isMobile && !expandedApp && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p 
            className="text-xs text-gray-600 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            Move your mouse to explore • Click Weather, Messages, or Clock icons
          </p>
        </div>
      )}

      {isMobile && hasOrientationPermission && activePanel === 'icons' && !expandedApp && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-40">
          <p 
            className="text-xs text-gray-600 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            Swipe or tap edges • Tap Weather, Messages, or Clock
          </p>
        </div>
      )}

      <style>{`
        .panel-container {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .panel-inner {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .icon-item {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .bg-blobs {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .icon-click-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          cursor: pointer;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .panel-container,
          .icon-item {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}