# Despliegue Barato/Gratis: Render + PlanetScale

Esta guía te permite desplegar el FIFA VIP Dashboard de forma económica usando servicios gratuitos o de bajo costo.

## 💰 Costos Totales

| Servicio | Plan | Costo/mes | Limitaciones |
|----------|------|-----------|--------------|
| **Render** | Free | $0 | Se duerme tras 15 min sin tráfico, despierta en ~30s |
| **Render** | Starter | $7 | Siempre activo, 512 MB RAM |
| **PlanetScale** | Hobby | $0 | 5 GB storage, 1 billón rows reads |
| **PlanetScale** | Scaler Pro | $29 | 10 GB storage, sin límites de reads |

**Recomendado para empezar:** Render Free + PlanetScale Hobby = **$0/mes**

---

## Paso 1: Configurar Base de Datos (PlanetScale)

### 1.1 Crear cuenta y base de datos
1. Ve a [planetscale.com](https://planetscale.com) y crea una cuenta (gratis)
2. Haz clic en "Create database"
3. Nombre: `fifa-vip-db` (o el que prefieras)
4. Región: Selecciona la más cercana a tu audiencia
5. Plan: **Hobby** (gratis)

### 1.2 Obtener string de conexión
1. En tu base de datos, ve a "Connect"
2. Selecciona "Node.js" como framework
3. Crea una nueva contraseña (se genera automáticamente)
4. Copia el **connection string** que aparece:
   ```
   mysql://user:password@host.us-east-3.psdb.cloud/fifa-vip-db?ssl={"rejectUnauthorized":true}
   ```
5. **IMPORTANTE:** Guarda esta URL, solo se muestra una vez

### 1.3 Ejecutar migraciones
Una vez que tengas la URL de conexión:

```bash
# En tu máquina local
export DATABASE_URL="mysql://user:password@host.psdb.cloud/fifa-vip-db?ssl={\"rejectUnauthorized\":true}"
pnpm db:push
```

Esto creará todas las tablas necesarias en PlanetScale.

---

## Paso 2: Desplegar en Render

### 2.1 Conectar repositorio
1. Ve a [render.com](https://render.com) y crea una cuenta (gratis)
2. En el dashboard, haz clic en "New +" → "Web Service"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `fifa-vip`
5. Render detectará automáticamente el archivo `render.yaml`

### 2.2 Configurar variables de entorno
En la sección "Environment" del servicio, añade:

| Key | Value | Ejemplo |
|-----|-------|---------|
| `DATABASE_URL` | Tu URL de PlanetScale | `mysql://user:pass@host.psdb.cloud/fifa-vip-db?ssl=...` |
| `NEWS_API_KEY` | Tu API key de NewsAPI.org | `abc123def456...` |
| `FOOTBALL_DATA_API_KEY` | Tu API key de Football-Data.org | `xyz789...` |
| `NODE_ENV` | `production` | (ya configurado en render.yaml) |

### 2.3 Desplegar
1. Haz clic en "Create Web Service"
2. Render automáticamente:
   - Clonará tu repo
   - Ejecutará `pnpm install --frozen-lockfile && pnpm build`
   - Iniciará el servidor con `pnpm start`
3. Espera ~3-5 minutos para el primer despliegue

### 2.4 Verificar
- Tu app estará disponible en: `https://fifa-vip-dashboard.onrender.com`
- Si estás en el plan Free, tardará ~30s en despertar la primera vez

---

## Paso 3: Despliegues Automáticos

Render se conecta directamente con tu repositorio de GitHub:
- Cada `git push` a la rama `master` desplegará automáticamente
- Puedes ver los logs en tiempo real en el dashboard de Render
- Los fallos de deploy se notifican por email

---

## Alternativas de Bajo Costo

### Railway (Similar a Render)
- **Gratis:** $5 de créditos gratis/mes (suficiente para proyectos pequeños)
- **Pago:** $5/mes por 200 horas de compute
- **Ventaja:** Incluye base de datos PostgreSQL/MySQL gratis en el mismo plan
- **Desventaja:** Más complejo de configurar

### Fly.io
- **Gratis:** 3 VMs compartidas (256 MB RAM cada una)
- **Ventaja:** Más control, Redis incluido
- **Desventaja:** Requiere CLI y más configuración técnica

### VPS Económicos (DigitalOcean, Linode, Hetzner)
- **Costo:** ~$5-6/mes por VPS completo
- **Ventaja:** Control total, sin "sleep", puedes hostear múltiples apps
- **Desventaja:** Debes configurar todo manualmente (Nginx, SSL, Docker, etc.)

---

## Optimizaciones para Plan Gratis (Render)

### Evitar el "sleep" sin pagar
Render Free se duerme tras 15 min de inactividad. Opciones:

1. **Cron externo gratis (recomendado):**
   - Usa [cron-job.org](https://cron-job.org) (gratis)
   - Configura un job que haga ping a tu app cada 10 minutos:
     - URL: `https://fifa-vip-dashboard.onrender.com/`
     - Intervalo: cada 10 minutos
   - Esto mantiene tu app despierta 24/7

2. **GitHub Actions (gratis para repos públicos):**
   ```yaml
   # .github/workflows/keep-alive.yml
   name: Keep Render Awake
   on:
     schedule:
       - cron: '*/10 * * * *'  # cada 10 minutos
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - run: curl https://fifa-vip-dashboard.onrender.com/
   ```

3. **Actualizar a Render Starter ($7/mes):**
   - Siempre activo, sin cold starts
   - Mejor rendimiento (512 MB RAM vs 256 MB)

### Reducir uso de base de datos
Si te acercas a los límites de PlanetScale:
- Los trabajos en segundo plano (`server/jobs.ts`) ya cachean en DB
- Considera aumentar los intervalos de refresco (ej: noticias cada 30 min en vez de 15)
- Usa menos competiciones de fútbol para reducir llamadas a la API

---

## Comparación Final: Gratis vs Barato

### Opción 1: GRATIS ($0/mes)
- ✅ Render Free + PlanetScale Hobby
- ⚠️ Se duerme tras 15 min (despierta en 30s)
- ⚠️ 256 MB RAM (suficiente para este proyecto)
- ✅ Perfecto para demos, portafolio, proyectos personales

### Opción 2: BARATA ($7/mes)
- ✅ Render Starter + PlanetScale Hobby
- ✅ Siempre activo, 0 latencia
- ✅ 512 MB RAM
- ✅ Ideal para producción pequeña, clientes reales

### Opción 3: PROFESIONAL ($12-15/mes)
- ✅ Render Starter + Base de datos dedicada (Render PostgreSQL o Managed MySQL)
- ✅ Sin límites de reads/storage
- ✅ Backups automáticos
- ✅ Para apps con alto tráfico

---

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada en Render
- PlanetScale requiere `ssl={"rejectUnauthorized":true}` en la URL
- Asegúrate de haber ejecutado `pnpm db:push` antes del primer deploy

### Error: "News API not working"
- Revisa que `NEWS_API_KEY` esté configurada en Render
- NewsAPI.org limita a 100 requests/día en plan gratis
- Si excedes el límite, la app seguirá funcionando con datos cacheados

### App muy lenta en Render Free
- Es normal el cold start (~30s) tras 15 min de inactividad
- Configura un cron externo para mantenerla despierta
- O actualiza a Render Starter ($7/mes)

### Error 429 (Too Many Requests) en Football API
- Football-Data.org limita a 10 requests/min en plan gratis
- El código ya maneja esto con fallbacks
- Para más competiciones, necesitas plan premium (~€8/mes)

---

## Soporte

Si tienes problemas:
1. Revisa los logs en Render dashboard (sección "Logs")
2. Verifica las variables de entorno en Render
3. Confirma que las migraciones corrieron: `pnpm db:push`
4. Consulta la sección de troubleshooting arriba

---

## Próximos Pasos

Una vez desplegado:
1. Configura un dominio personalizado (gratis en Render)
2. Añade cron externo para evitar sleep
3. Monitorea uso de PlanetScale en su dashboard
4. Considera actualizar a planes pagos si crece el tráfico
