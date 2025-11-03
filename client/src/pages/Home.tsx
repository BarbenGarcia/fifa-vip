import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, Newspaper, Trophy } from 'lucide-react';
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

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch news and weather data
  const worldNews = trpc.news.getWorld.useQuery();
  const footballNews = trpc.news.getFootball.useQuery();
  const weather = trpc.weather.getZurich.useQuery();

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
    ]);
    setIsRefreshing(false);
  };

  const weatherData = weather.data as Weather | null;
  const worldNewsData = (worldNews.data || []) as NewsArticle[];
  const footballNewsData = (footballNews.data || []) as NewsArticle[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-16 w-16" />}
            <div>
              <h1 className="text-4xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-lg text-slate-400">VIP Dashboard</p>
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
              <p className="text-lg text-slate-400">
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
              variant="outline"
              size="lg"
              className="ml-6 px-8 py-6"
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
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white text-3xl">
                <Cloud className="w-10 h-10" />
                Zurich Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {weather.isLoading ? (
                <div className="text-slate-300 text-2xl">Loading weather...</div>
              ) : weatherData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-slate-300 text-xl mb-2">Temperature</p>
                    <p className="text-6xl font-bold text-white">
                      {weatherData.temperature}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-xl mb-2">Condition</p>
                    <p className="text-3xl font-semibold text-white">
                      {weatherData.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-xl mb-2">Wind Speed</p>
                    <p className="text-4xl font-bold text-white">
                      {weatherData.windSpeed} km/h
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-xl mb-2">Humidity</p>
                    <p className="text-4xl font-bold text-white">
                      {weatherData.humidity}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-300 text-2xl">Unable to load weather data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* News Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* World News */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="w-8 h-8 text-slate-300" />
              <h2 className="text-3xl font-bold text-white">World News</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {worldNews.isLoading ? (
                <div className="text-slate-400">Loading news...</div>
              ) : worldNewsData.length > 0 ? (
                worldNewsData.map((article, idx) => (
                  <Card
                    key={idx}
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <CardContent className="p-6">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded mb-4"
                        />
                      )}
                      <h3 className="font-semibold text-white text-lg mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">{article.source}</p>
                        <p className="text-sm text-slate-500">
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-slate-400">No news available</div>
              )}
            </div>
          </div>

          {/* Football/FIFA News */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Football & FIFA News</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {footballNews.isLoading ? (
                <div className="text-slate-400">Loading news...</div>
              ) : footballNewsData.length > 0 ? (
                footballNewsData.map((article, idx) => (
                  <Card
                    key={idx}
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <CardContent className="p-6">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded mb-4"
                        />
                      )}
                      <h3 className="font-semibold text-white text-lg mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500">{article.source}</p>
                        <p className="text-sm text-slate-500">
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-slate-400">No news available</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
