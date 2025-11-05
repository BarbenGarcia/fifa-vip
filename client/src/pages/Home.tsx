'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, Newspaper, Trophy, Zap } from 'lucide-react';
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
  const matches = trpc.matches.getRecent.useQuery();

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
      matches.refetch(),
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
        {/* Weather Widget */}
        <div className="mb-12">
          <Card className="border-4 shadow-lg" style={{ backgroundColor: 'rgba(0, 61, 165, 0.2)', borderColor: fifaGold }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-3xl font-bold">
                <Cloud className="w-8 h-8" style={{ color: fifaGold }} />
                Zurich Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weather.isLoading ? (
                <div className="text-xl text-gray-300">Loading weather data...</div>
              ) : weatherData ? (
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <p className="text-lg text-gray-300 mb-2">Temperature</p>
                    <p className="text-5xl font-bold text-white">{weatherData.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-lg text-gray-300 mb-2">Condition</p>
                    <p className="text-4xl font-bold text-white">{weatherData.description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-lg text-gray-300 mb-2">Wind Speed</p>
                    <p className="text-4xl font-bold text-white">{weatherData.windSpeed} km/h</p>
                  </div>
                  <div>
                    <p className="text-lg text-gray-300 mb-2">Humidity</p>
                    <p className="text-4xl font-bold text-white">{weatherData.humidity}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-xl text-gray-300">Unable to load weather data</div>
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
