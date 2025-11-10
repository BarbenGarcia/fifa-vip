import React from 'react';

// Minimal mapping of Open-Meteo weather codes to unicode/icon + label
const CODE_MAP: Record<number, { icon: string; label: string; severity: number }> = {
  0: { icon: '☀️', label: 'Clear', severity: 0 },
  1: { icon: '🌤️', label: 'Mainly Clear', severity: 0 },
  2: { icon: '⛅', label: 'Partly Cloudy', severity: 0 },
  3: { icon: '☁️', label: 'Overcast', severity: 0 },
  45: { icon: '🌫️', label: 'Fog', severity: 1 },
  48: { icon: '🌫️', label: 'Fog', severity: 1 },
  51: { icon: '🌦️', label: 'Light Drizzle', severity: 1 },
  53: { icon: '🌦️', label: 'Drizzle', severity: 1 },
  55: { icon: '🌧️', label: 'Heavy Drizzle', severity: 2 },
  61: { icon: '🌦️', label: 'Light Rain', severity: 1 },
  63: { icon: '🌧️', label: 'Rain', severity: 2 },
  65: { icon: '🌧️', label: 'Heavy Rain', severity: 3 },
  71: { icon: '🌨️', label: 'Snow', severity: 2 },
  73: { icon: '🌨️', label: 'Snow', severity: 2 },
  75: { icon: '❄️', label: 'Heavy Snow', severity: 3 },
  77: { icon: '❄️', label: 'Snow Grains', severity: 2 },
  80: { icon: '🌦️', label: 'Showers', severity: 1 },
  81: { icon: '🌧️', label: 'Showers', severity: 2 },
  82: { icon: '🌧️', label: 'Violent Showers', severity: 3 },
  85: { icon: '🌨️', label: 'Snow Showers', severity: 2 },
  86: { icon: '🌨️', label: 'Snow Showers', severity: 3 },
  95: { icon: '⛈️', label: 'Thunderstorm', severity: 3 },
  96: { icon: '⛈️', label: 'Storm (Hail)', severity: 3 },
  99: { icon: '⛈️', label: 'Severe Storm', severity: 4 },
};

export function weatherCodeMeta(code: number) {
  return CODE_MAP[code] || { icon: '❔', label: 'Unknown', severity: 0 };
}

interface WeatherIconProps {
  code: number | null | undefined;
  size?: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ code, size = 32, className }) => {
  const meta = weatherCodeMeta(code ?? -1);
  return (
    <span
      aria-label={meta.label}
      title={meta.label}
      style={{ fontSize: size, lineHeight: 1 }}
      className={className}
    >
      {meta.icon}
    </span>
  );
};

export function severityBg(severity: number) {
  switch (severity) {
    case 0: return 'rgba(255,255,255,0.05)';
    case 1: return 'rgba(255,215,0,0.10)';
    case 2: return 'rgba(255,140,0,0.15)';
    case 3: return 'rgba(255,69,0,0.18)';
    case 4: return 'rgba(255,0,0,0.22)';
    default: return 'rgba(255,255,255,0.05)';
  }
}

export function severityBorder(severity: number) {
  switch (severity) {
    case 0: return 'transparent';
    case 1: return 'rgba(255,215,0,0.4)';
    case 2: return 'rgba(255,165,0,0.5)';
    case 3: return 'rgba(255,69,0,0.6)';
    case 4: return 'rgba(255,0,0,0.7)';
    default: return 'transparent';
  }
}

export default WeatherIcon;
