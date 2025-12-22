import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from 'lucide-react';
import GLBIcon from '../components/3d/GLBIcon';

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

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

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
              transition-all duration-200
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
function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: 72,
    feelsLike: 70,
    humidity: 55,
    windSpeed: 8,
    condition: 'Sunny',
    icon: 'sun',
    location: 'New York',
    country: 'US',
    forecast: [
      { day: 'Tue', temp: 74, icon: 'sun' },
      { day: 'Wed', temp: 71, icon: 'cloud' },
      { day: 'Thu', temp: 73, icon: 'sun' }
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
                
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=4&temperature_unit=fahrenheit&wind_speed_unit=mph`
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
                const forecast = (data.daily?.time || []).slice(1, 4).map((date, idx) => {
                  const d = new Date(date);
                  const code = data.daily?.weather_code?.[idx + 1] || 0;
                  const forecastInfo = weatherCodes[code] || { condition: 'Clear', icon: 'sun' };
                  return {
                    day: dayNames[d.getDay()],
                    temp: Math.round(data.daily?.temperature_2m_max?.[idx + 1] || 70),
                    icon: forecastInfo.icon
                  };
                });
                
                setWeather({
                  temp: Math.round(data.current?.temperature_2m || 72),
                  feelsLike: Math.round(data.current?.apparent_temperature || 70),
                  humidity: Math.round(data.current?.relative_humidity_2m || 55),
                  windSpeed: Math.round(data.current?.wind_speed_10m || 8),
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  location: 'Your Location',
                  country: '',
                  forecast: forecast.length > 0 ? forecast : weather.forecast
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
          {weather.forecast.map((day, idx) => (
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

export default function Portfolio() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [deviceOrientation, setDeviceOrientation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [activePanel, setActivePanel] = useState('icons'); // 'icons', 'calendar', 'weather'
  const [isReady, setIsReady] = useState(false);

  // Force a render cycle on mount to ensure 3D icons appear
  useEffect(() => {
    // Small delay to ensure Canvas is mounted and ready
    const timer = setTimeout(() => {
      setIsReady(true);
      // Trigger a small mouse movement to initialize the 3D scene
      setMousePos({ x: 0.001, y: 0.001 });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for mobile/small screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request device orientation permission (required for iOS 13+)
  useEffect(() => {
    const requestOrientationPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          setHasOrientationPermission(permission === 'granted');
        } catch (error) {
          console.log('Orientation permission error:', error);
        }
      } else {
        // Non-iOS devices don't need permission
        setHasOrientationPermission(true);
      }
    };

    // Auto-request on mobile, or wait for user interaction on iOS
    if (isMobile) {
      requestOrientationPermission();
    }
  }, [isMobile]);

  // Handle device orientation for mobile/tablet
  useEffect(() => {
    if (!isMobile || !hasOrientationPermission) return;

    const handleOrientation = (event) => {
      // gamma: left-right tilt (-90 to 90)
      // beta: front-back tilt (-180 to 180)
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;

      // Normalize values to -1 to 1 range (similar to mouse position)
      // Limit the range for subtle effect
      const x = Math.max(-1, Math.min(1, gamma / 30));
      const y = Math.max(-1, Math.min(1, (beta - 45) / 30)); // 45 is natural holding angle

      setDeviceOrientation({ x, y });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [isMobile, hasOrientationPermission]);

  // Handle mouse movement for desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Get the current spatial position (mouse for desktop, device orientation for mobile)
  const spatialPos = isMobile ? deviceOrientation : mousePos;

  const icons = [
    { type: 'glb', src: '/icons/weather.glb', label: 'Weather', depth: 1.4, scale: 0.5 },
    { type: 'glb', src: '/icons/message.glb', label: 'Messages', depth: 1.5, scale: 0.5 },
    { type: 'glb', src: '/icons/clock.glb', label: 'Clock', depth: 1.2, scale: 0.48 },
    { type: 'glb', src: '/icons/file.glb', label: 'Files', depth: 1.2, scale: 0.5 },
    { type: 'glb', src: '/icons/music.glb', label: 'Music', depth: 1.3, scale: 0.5 },
    { type: 'glb', src: '/icons/photo.glb', label: 'Photos', depth: 1.3, scale: 0.5 },
    { type: 'glb', src: '/icons/video.glb', label: 'Video', depth: 1.5, scale: 3.2 },
    { type: 'glb', src: '/icons/safari.glb', label: 'Safari', depth: 1.4, scale: 0.5 },
    { type: 'glb', src: '/icons/setting.glb', label: 'Settings', depth: 1.2, scale: 0.48 },
    { type: 'glb', src: '/icons/findmy.glb', label: 'Find My', depth: 1.3, scale: 0.5 },
  ];

  const getTransform = (depth) => {
    const pos = spatialPos;
    const rotateX = -pos.y * 8 * depth;
    const rotateY = pos.x * 8 * depth;
    const translateZ = depth * 10;
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
  };

  const getIconTransform = (index, depth) => {
    const pos = spatialPos;
    const offsetX = pos.x * 20 * depth;
    const offsetY = pos.y * 20 * depth;

    const positions = [
      { x: 0.20, y: 0.15 },
      { x: 0.50, y: 0.15 },
      { x: 0.80, y: 0.15 },
      { x: 0.05, y: 0.50 },
      { x: 0.35, y: 0.50 },
      { x: 0.65, y: 0.50 },
      { x: 0.95, y: 0.50 },
      { x: 0.20, y: 0.85 },
      { x: 0.50, y: 0.85 },
      { x: 0.80, y: 0.85 },
    ];

    if (isHovered !== null) {
      if (isHovered === index) {
        return `translate(${offsetX}px, ${offsetY}px) scale(1.25)`;
      } else {
        const pos = positions[index];
        const hoveredPos = positions[isHovered];
        const dx = pos.x - hoveredPos.x;
        const dy = pos.y - hoveredPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pushDistance = Math.max(0, 60 - distance * 150);
        const pushX = (dx / (distance || 1)) * pushDistance;
        const pushY = (dy / (distance || 1)) * pushDistance;
        return `translate(${offsetX + pushX}px, ${offsetY + pushY}px) scale(0.9)`;
      }
    }
    return `translate(${offsetX}px, ${offsetY}px) scale(1)`;
  };

  // VisionOS-style glass panel styling
  const visionOSPanelStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.4)',
    boxShadow: `
      0 8px 32px rgba(0,0,0,0.1),
      0 2px 8px rgba(0,0,0,0.05),
      inset 0 1px 0 rgba(255,255,255,0.5),
      inset 0 -1px 0 rgba(255,255,255,0.1)
    `
  };

  const iconSize = 'clamp(55px, 7vw, 85px)';

  const iconPositions = [
    { x: '20%', y: '15%', size: iconSize },
    { x: '50%', y: '15%', size: iconSize },
    { x: '80%', y: '15%', size: iconSize },
    { x: '5%', y: '50%', size: iconSize },
    { x: '35%', y: '50%', size: iconSize },
    { x: '65%', y: '50%', size: iconSize },
    { x: '95%', y: '50%', size: iconSize },
    { x: '20%', y: '85%', size: iconSize },
    { x: '50%', y: '85%', size: iconSize },
    { x: '80%', y: '85%', size: iconSize },
  ];

  // VisionOS spring animation timing
  const visionOSTransition = 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)';

  // Get panel transform and styles based on active state
  const getCalendarPanelStyle = () => {
    if (!isMobile) {
      return {
        left: 'clamp(40px, 8vw, 120px)',
        transform: `translateY(-50%) ${getTransform(0.6)}`,
        zIndex: 10
      };
    }
    
    const isActive = activePanel === 'calendar';
    const spatialRotateX = -spatialPos.y * 5;
    const spatialRotateY = spatialPos.x * 5;
    
    return {
      left: '50%',
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg) translateZ(0px)`
        : `translate(-95%, -50%) scale(0.75) rotateY(35deg) translateZ(-200px)`,
      opacity: isActive ? 1 : 0.7,
      filter: isActive ? 'blur(0px)' : 'blur(2px)',
      zIndex: isActive ? 30 : 5,
      pointerEvents: 'auto'
    };
  };

  const getIconsPanelStyle = () => {
    if (!isMobile) {
      return {
        transform: `translate(-50%, -50%) ${getTransform(0.5)}`,
        zIndex: 20,
        pointerEvents: 'auto'
      };
    }
    
    const isActive = activePanel === 'icons';
    const spatialRotateX = -spatialPos.y * 5;
    const spatialRotateY = spatialPos.x * 5;
    
    return {
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg) translateZ(0px)`
        : 'translate(-50%, -50%) scale(0.8) translateZ(-150px)',
      opacity: isActive ? 1 : 0.5,
      filter: isActive ? 'blur(0px)' : 'blur(4px)',
      zIndex: isActive ? 30 : 10,
      pointerEvents: isActive ? 'auto' : 'none'
    };
  };

  const getWeatherPanelStyle = () => {
    if (!isMobile) {
      return {
        right: 'clamp(40px, 8vw, 120px)',
        transform: `translateY(-50%) ${getTransform(0.6)}`,
        zIndex: 10
      };
    }
    
    const isActive = activePanel === 'weather';
    const spatialRotateX = -spatialPos.y * 5;
    const spatialRotateY = spatialPos.x * 5;
    
    return {
      left: '50%',
      right: 'auto',
      transform: isActive 
        ? `translate(-50%, -50%) scale(1) rotateX(${spatialRotateX}deg) rotateY(${spatialRotateY}deg) translateZ(0px)`
        : 'translate(-5%, -50%) scale(0.75) rotateY(-35deg) translateZ(-200px)',
      opacity: isActive ? 1 : 0.7,
      filter: isActive ? 'blur(0px)' : 'blur(2px)',
      zIndex: isActive ? 30 : 5,
      pointerEvents: 'auto'
    };
  };

  const handlePanelClick = (panelType, e) => {
    if (isMobile) {
      e.stopPropagation();
      setActivePanel(panelType);
    }
  };

  // Handle background click to return to icons panel
  const handleBackgroundClick = (e) => {
    if (isMobile && activePanel !== 'icons') {
      // Only trigger if clicking on the background, not on a panel
      if (e.target === e.currentTarget) {
        setActivePanel('icons');
      }
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-300 overflow-hidden"
      onClick={handleBackgroundClick}
    >
      {/* Background effects */}
      <div 
        className="absolute inset-0 transition-transform duration-300 ease-out pointer-events-none" 
        style={{ transform: getTransform(0.3) }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/20 rounded-full blur-3xl" />
      </div>

      {/* Clickable overlay to return to icons when side panel is active */}
      {isMobile && activePanel !== 'icons' && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => setActivePanel('icons')}
        />
      )}

      {/* Left Panel - Date/Time & Calendar */}
      <div 
        className="absolute top-1/2"
        style={{ 
          ...getCalendarPanelStyle(),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition
        }}
        onClick={(e) => handlePanelClick('calendar', e)}
      >
        <div 
          className="rounded-3xl p-4 flex flex-col overflow-hidden cursor-pointer"
          style={{ 
            ...visionOSPanelStyle,
            width: isMobile ? 'clamp(280px, 85vw, 340px)' : 'clamp(180px, 18vw, 280px)',
            height: isMobile ? 'clamp(400px, 75vh, 520px)' : 'clamp(320px, 42vh, 480px)',
            transform: isMobile ? 'none' : 'rotateY(12deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <DateTimeDisplay />
          <CalendarWidget />
        </div>
      </div>

      {/* Center Panel - Icons */}
      <div 
        className="absolute left-1/2 top-1/2"
        style={{
          ...getIconsPanelStyle(),
          transformStyle: isMobile ? 'preserve-3d' : 'flat',
          transition: visionOSTransition
        }}
        onClick={(e) => handlePanelClick('icons', e)}
      >
        <div 
          className="relative"
          style={{ 
            width: isMobile ? 'clamp(320px, 95vw, 420px)' : 'clamp(300px, 40vw, 500px)',
            height: isMobile ? 'clamp(320px, 55vh, 420px)' : 'clamp(280px, 45vh, 450px)'
          }}
        >
          {icons.map((item, index) => {
            const { src, label, depth, scale = 0.5 } = item;
            const pos = iconPositions[index];
            return (
              <div 
                key={index}
                className="absolute transition-all duration-500 ease-out"
                style={{ 
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%, -50%) ${getIconTransform(index, depth)}`,
                  opacity: isHovered !== null && isHovered !== index ? 0.4 : 1,
                  zIndex: isHovered === index ? 100 : 1
                }}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
                onTouchStart={() => setIsHovered(index)}
                onTouchEnd={() => setTimeout(() => setIsHovered(null), 300)}
              >
                <div className="relative group cursor-pointer">
                  <div 
                    className="flex items-center justify-center"
                    style={{ 
                      width: isMobile ? 'clamp(55px, 14vw, 75px)' : pos.size, 
                      height: isMobile ? 'clamp(55px, 14vw, 75px)' : pos.size 
                    }}
                  >
                    <GLBIcon 
                      src={src} 
                      isHovered={isHovered === index} 
                      scale={scale} 
                      mousePos={mousePos}
                    />
                  </div>
                  <div 
                    className={`
                      absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-700 
                      whitespace-nowrap transition-opacity duration-300 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg
                      ${isHovered === index ? 'opacity-100' : 'opacity-0'}
                    `}
                  >
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Weather */}
      <div 
        className="absolute top-1/2"
        style={{ 
          ...getWeatherPanelStyle(),
          transformStyle: 'preserve-3d',
          transition: visionOSTransition
        }}
        onClick={(e) => handlePanelClick('weather', e)}
      >
        <div 
          className="rounded-3xl p-4 overflow-hidden cursor-pointer"
          style={{ 
            ...visionOSPanelStyle,
            width: isMobile ? 'clamp(280px, 85vw, 340px)' : 'clamp(160px, 16vw, 240px)',
            height: isMobile ? 'clamp(400px, 75vh, 520px)' : 'clamp(320px, 42vh, 480px)',
            transform: isMobile ? 'none' : 'rotateY(-12deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <WeatherWidget />
        </div>
      </div>

      {/* Mobile Navigation Dots */}
      {isMobile && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40">
          {['calendar', 'icons', 'weather'].map((panel) => (
            <button
              key={panel}
              onClick={(e) => {
                e.stopPropagation();
                setActivePanel(panel);
              }}
              className="relative p-1"
            >
              <div 
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-500
                  ${activePanel === panel 
                    ? 'bg-gray-800 scale-125' 
                    : 'bg-gray-400/60'
                  }
                `}
                style={{
                  boxShadow: activePanel === panel 
                    ? '0 0 12px rgba(0,0,0,0.3)' 
                    : 'none'
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* iOS Permission Request Button */}
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

      {/* Desktop hint */}
      {!isMobile && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p 
            className="text-xs text-gray-600 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            Move your mouse to explore the 3D space
          </p>
        </div>
      )}

      {/* Mobile hint */}
      {isMobile && hasOrientationPermission && activePanel === 'icons' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-40">
          <p 
            className="text-xs text-gray-600 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            Tilt device to explore • Tap panels to switch
          </p>
        </div>
      )}
    </div>
  );
}