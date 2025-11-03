# FIFA VIP Dashboard - User Guide

## Overview

**Website Purpose**: Monitor real-time weather in Zurich, world news, and football/FIFA news all in one professional dashboard optimized for Microsoft Surface Hub display.

**Access**: Public access (no login required)

**Technology Stack**: Built with React 19, TypeScript, Tailwind CSS, Express.js backend, MySQL database, and tRPC for type-safe API calls. Auto-scaling infrastructure with global CDN deployment.

---

## Using Your Dashboard

### Weather Widget

The Zurich Weather section displays current conditions including temperature, weather description, wind speed, and humidity. Weather data updates automatically every 15 minutes from Open-Meteo's free weather API. Simply view the large, easy-to-read metrics at the top of your dashboard.

### World News Feed

The "World News" section shows the latest global news articles. Click any article card to open the full story in a new window. Articles include thumbnail images, titles, descriptions, source attribution, and publication dates. The feed automatically refreshes every 5 minutes with the latest headlines.

### Football & FIFA News

The "Football & FIFA News" section displays sports-specific coverage including FIFA updates, match reports, and football news worldwide. Like the World News section, click any article to read the full story. This feed also updates automatically every 5 minutes.

### Manual Refresh

Click the refresh button in the top-right corner to immediately update all data (weather, world news, and football news) without waiting for the automatic refresh cycle.

### Time Display

The header shows the current time and date, updating every second for real-time reference.

---

## Managing Your Dashboard

Access the Management UI panels through the dashboard interface:

- **Settings**: Customize website name, logo, and visibility settings
- **Database**: View and manage stored news and weather cache data
- **Dashboard**: Monitor analytics and performance metrics

Your dashboard automatically caches news and weather data in the database to ensure fast loading and reduced API calls.

---

## Next Steps

Talk to Manus AI anytime to request changes, add new features, or customize your dashboard further. Consider adding additional news categories, different weather locations, or custom branding to make this dashboard uniquely yours for your FIFA VIP experience.

