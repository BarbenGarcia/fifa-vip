'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, Newspaper, Trophy, Zap, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from 'recharts';
import { APP_LOGO, APP_TITLE } from '@/const';

interface NewsArticle {
  id: number;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: Date | null;
}

interface Weather {
  id: number;
  temperature: string | null;
  weatherCode: number | null;
  windSpeed: string | null;
  humidity: string | null;
  description: string | null;
}

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  league: string;
  status: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // FIFA brand colors
  const fifaBlue = '#003DA5';
  const fifaGold = '#FFD700';
  const fifaWhite = '#FFFFFF';

  // Fetch news and weather data
  const worldNews = trpc.news.getWorld.useQuery();
  const footballNews = trpc.news.getFootball.useQuery();
  const weather = trpc.weather.getZurich.useQuery();
  const forecast = trpc.weather.getZurichForecast.useQuery();
  const matches = trpc.matches.getRecent.useQuery();
  const liveMatches = trpc.matches.getLive.useQuery();

  // Weather code mapping → label, icon, severity
  const getWeatherMeta = (code?: number) => {
    const c = code ?? 0;
    if ([0].includes(c)) return { label: 'Clear sky', Icon: Sun, severity: 'good' as const };
    if ([1, 2, 3].includes(c)) return { label: 'Cloudy', Icon: Cloud, severity: 'good' as const };
    if ([45, 48].includes(c)) return { label: 'Fog', Icon: CloudFog, severity: 'warn' as const };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(c)) return { label: 'Rain', Icon: CloudRain, severity: 'warn' as const };
    if ([71, 73, 75, 77, 85, 86].includes(c)) return { label: 'Snow', Icon: CloudSnow, severity: 'warn' as const };
    if ([95, 96, 99].includes(c)) return { label: 'Thunderstorm', Icon: CloudLightning, severity: 'bad' as const };
    return { label: 'Unknown', Icon: Cloud, severity: 'good' as const };
  };

  const severityBg = (severity: 'good' | 'warn' | 'bad') => {
    if (severity === 'good') return 'rgba(34,197,94,0.12)';
    if (severity === 'warn') return 'rgba(234,179,8,0.15)';
    return 'rgba(239,68,68,0.15)';
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      worldNews.refetch(),
      footballNews.refetch(),
      weather.refetch(),
      forecast.refetch(),
      matches.refetch(),
      liveMatches.refetch(),
    ]);
    setIsRefreshing(false);
  };

  const weatherData = weather.data as Weather | null;
  const worldNewsData = (worldNews.data || []) as NewsArticle[];
  const footballNewsData = (footballNews.data || []) as NewsArticle[];
  const matchesData = (matches.data || []) as Match[];

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `linear-gradient(135deg, ${fifaBlue} 0%, #1a3a70 100%)` }}>
      {/* Header with FIFA Branding */}
      <header className="sticky top-0 z-50 shadow-lg border-b-4" style={{ backgroundColor: fifaBlue, borderBottomColor: fifaGold }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12" style={{ color: fifaGold }} />
            <div>
              <h1 className="text-4xl font-bold text-white">FIFA VIP Dashboard</h1>
              <p className="text-lg font-semibold" style={{ color: fifaGold }}>Dan O'Toole - Executive Office</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-semibold text-white">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
              <p className="text-lg" style={{ color: fifaGold }}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="lg"
              className="ml-6 px-8 py-6 font-semibold"
              style={{ backgroundColor: fifaGold, color: fifaBlue }}
            >
              <RefreshCw className={`w-8 h-8 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Weather Current + 5-Day Forecast */}
        <div className="mb-12">
          <Card className="border-4 shadow-lg" style={{ backgroundColor: 'rgba(0, 61, 165, 0.18)', borderColor: fifaGold }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <Cloud className="w-7 h-7" style={{ color: fifaGold }} />
                Zurich Weather & 7-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {weather.isLoading ? (
                <div className="text-xl text-gray-300">Loading weather data...</div>
              ) : weatherData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Temperature</p>
                    <p className="text-4xl font-bold text-white">{weatherData.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Condition</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const { Icon } = getWeatherMeta(weatherData.weatherCode ?? undefined);
                        return <Icon className="w-6 h-6" style={{ color: fifaGold }} />;
                      })()}
                      <p className="text-2xl font-bold text-white">{weatherData.description || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Wind</p>
                    <p className="text-2xl font-bold text-white">{weatherData.windSpeed} km/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 mb-1">Humidity</p>
                    <p className="text-2xl font-bold text-white">{weatherData.humidity}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-xl text-gray-300">Unable to load weather data</div>
              )}
              {forecast.isLoading ? (
                <div className="text-lg text-gray-300">Loading forecast...</div>
              ) : (forecast.data || []).length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    {(forecast.data as any[]).map((d: any) => {
                      const meta = getWeatherMeta(d.weatherCode);
                      return (
                        <div key={d.date} className="p-3 rounded-lg text-center" style={{ backgroundColor: severityBg(meta.severity) }}>
                          <div className="text-[10px] text-gray-300 mb-1">
                            {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <meta.Icon className="w-4 h-4" style={{ color: fifaGold }} />
                            <span className="text-[10px] text-gray-200">{meta.label}</span>
                          </div>
                          <div className="text-lg font-bold text-white mb-1">
                            {Math.round(d.tMax)}° / <span className="text-gray-300 text-sm">{Math.round(d.tMin)}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Temperature trend chart */}
                  <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
                    <div className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                      <span style={{ color: fifaGold }}>📈</span> 7-Day Max Temperature Trend
                    </div>
                    <div style={{ width: '100%', height: 120 }}>
                      <ResponsiveContainer>
                        <AreaChart
                          data={(forecast.data as any[]).map((d: any) => ({
                            day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                            temp: Math.round(d.tMax),
                          }))}
                          margin={{ left: 10, right: 10, top: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={fifaGold} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={fifaGold} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: 11 }} />
                          <YAxis stroke="#9ca3af" style={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                          <ReTooltip
                            cursor={{ fill: 'rgba(255,215,0,0.1)' }}
                            contentStyle={{
                              background: 'rgba(0, 61, 165, 0.95)',
                              border: `2px solid ${fifaGold}`,
                              borderRadius: 8,
                              color: '#fff',
                              fontSize: 13,
                            }}
                            labelStyle={{ color: fifaGold, fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value}°C`, 'Max Temp']}
                          />
                          <Area
                            type="monotone"
                            dataKey="temp"
                            stroke={fifaGold}
                            strokeWidth={3}
                            fill="url(#tempGradient)"
                            dot={{ r: 4, fill: fifaGold, stroke: fifaBlue, strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: fifaGold }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-lg text-gray-300">No forecast available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* News Sections */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* World News */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="w-8 h-8" style={{ color: fifaGold }} />
              <h2 className="text-3xl font-bold">World News</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {worldNews.isLoading ? (
                <div className="text-lg text-gray-300">Loading world news...</div>
              ) : worldNewsData.length > 0 ? (
                worldNewsData.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg transition-all hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: `4px solid ${fifaGold}` }}
                  >
                    {article.imageUrl && (
                      <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover rounded mb-3" />
                    )}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{article.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: fifaGold }}>{article.source}</span>
                      <span className="text-gray-400">
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-lg text-gray-300">No news available</div>
              )}
            </div>
          </div>

          {/* FIFA & International Football News */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8" style={{ color: fifaGold }} />
              <h2 className="text-3xl font-bold">FIFA & International News</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {footballNews.isLoading ? (
                <div className="text-lg text-gray-300">Loading FIFA news...</div>
              ) : footballNewsData.length > 0 ? (
                footballNewsData.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg transition-all hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: `4px solid ${fifaGold}` }}
                  >
                    {article.imageUrl && (
                      <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover rounded mb-3" />
                    )}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{article.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span style={{ color: fifaGold }}>{article.source}</span>
                      <span className="text-gray-400">
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-lg text-gray-300">No FIFA news available</div>
              )}
            </div>
          </div>
        </div>

        {/* Live Matches & Upcoming Fixtures Widget */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8" style={{ color: fifaGold }} />
            <h2 className="text-3xl font-bold">Live Matches & Upcoming Fixtures</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {liveMatches.isLoading ? (
              <div className="col-span-full text-lg text-gray-300">Loading matches...</div>
            ) : (liveMatches.data || []).length > 0 ? (
              (liveMatches.data || []).map((match: any) => (
                <div
                  key={match.id}
                  className="p-4 rounded-lg transition-all hover:scale-105"
                  style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: `4px solid ${fifaGold}` }}
                >
                  <div className="text-xs font-semibold mb-2" style={{ color: fifaGold }}>
                    {match.league} - {match.leagueCountry}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col items-center flex-1">
                      {match.homeTeamLogo && (
                        <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-8 h-8 mb-1" />
                      )}
                      <div className="text-sm font-bold text-white text-center line-clamp-2">{match.homeTeam}</div>
                    </div>
                    <div className="flex flex-col items-center px-3">
                      <div className="text-2xl font-bold text-white">
                        {match.homeScore !== null && match.awayScore !== null
                          ? `${match.homeScore} - ${match.awayScore}`
                          : 'vs'}
                      </div>
                      <div className="text-xs" style={{ color: fifaGold }}>
                        {match.status === 'live' ? 'LIVE' : match.status === 'scheduled' ? 'SOON' : 'FT'}
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      {match.awayTeamLogo && (
                        <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-8 h-8 mb-1" />
                      )}
                      <div className="text-sm font-bold text-white text-center line-clamp-2">{match.awayTeam}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    {new Date(match.matchDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-lg text-gray-300">No matches available</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t-2" style={{ borderTopColor: fifaGold }}>
          <p className="text-lg text-gray-300">
            Dashboard for <span style={{ color: fifaGold }} className="font-bold">Dan O'Toole</span> | Director, Executive Office at FIFA
          </p>
          <p className="text-sm text-gray-400 mt-2">Auto-refreshing every 5-15 minutes</p>
        </div>
      </main>
    </div>
  );
}
