# Despliegue GRATIS con Supabase

**Supabase es LA MEJOR opción gratuita** para este proyecto porque incluye TODO en un solo lugar:

## ✅ Qué incluye Supabase (GRATIS)

| Servicio | Plan Gratuito | Limitaciones |
|----------|---------------|--------------|
| **PostgreSQL Database** | 500 MB | Suficiente para el proyecto |
| **Auth** | Ilimitado | Si lo necesitas después |
| **Storage** | 1 GB | Para logos/imágenes |
| **Edge Functions** | 500,000 requests/mes | Más que suficiente |
| **Realtime** | Incluido | Actualizaciones en tiempo real |
| **Sin "sleep"** | ✅ Siempre activo | A diferencia de Render Free |

**Costo: $0/mes** (sin tarjeta de crédito requerida)

---

## 🚀 Pasos para Desplegar

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis, con GitHub)
2. Click en "New Project"
3. Llena los datos:
   - **Name**: `fifa-vip-dashboard`
   - **Database Password**: Genera una segura (guárdala)
   - **Region**: Selecciona la más cercana a tu audiencia
   - **Pricing Plan**: Free (sin tarjeta requerida)
4. Click "Create new project" (tarda ~2 minutos)

### 2. Obtener Connection String

1. En tu proyecto, ve a **Settings** → **Database**
2. En "Connection string" selecciona **URI** (no Pooling)
3. Copia la URL que aparece:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.fpxqbiswfmcvrbfszgth.supabase.co:5432/postgres
   ```
4. Reemplaza `[YOUR-PASSWORD]` con la contraseña que generaste en el paso 1

### 3. Migrar la Base de Datos

Desde tu máquina local:

```bash
# Configurar la connection string
export DATABASE_URL="postgresql://postgres:tu-password@db.fpxqbiswfmcvrbfszgth.supabase.co:5432/postgres"

# Ejecutar migraciones
pnpm db:push
```

Esto creará todas las tablas necesarias (`users`, `newsCache`, `weatherCache`, `matchesCache`).

### 4. Configurar Variables de Entorno en Supabase

Tienes dos opciones para el backend:

#### **Opción A: Deploy directo en Supabase (Recomendado)**

Supabase no tiene hosting tradicional de Node, pero puedes usar **Edge Functions** (Deno-based) o **deploy en Render/Vercel** apuntando a Supabase.

#### **Opción B: Usar Render + Supabase Database**

1. Ve a [render.com](https://render.com)
2. New Web Service → Conecta tu repo `fifa-vip`
3. Configura las variables de entorno:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu connection string de Supabase (del paso 2) |
| `NEWS_API_KEY` | Tu API key de NewsAPI.org |
| `FOOTBALL_DATA_API_KEY` | Tu API key de Football-Data.org |
| `NODE_ENV` | `production` |

4. Deploy! Render detectará el `render.yaml` automáticamente.

#### **Opción C: Usar Vercel + Supabase (Frontend estático + API Routes)**

Requiere separar el frontend del backend:
- Frontend → Vercel (gratis)
- Backend jobs → Vercel Cron (limitado)
- Database → Supabase

(Requiere más configuración, documentar si lo prefieres)

---

## 🔧 Actualizar Código Local para Desarrollo

El proyecto ya está configurado para PostgreSQL (Supabase). Solo necesitas:

```bash
# En tu máquina local
export DATABASE_URL="postgresql://postgres:tu-password@db.fpxqbiswfmcvrbfszgth.supabase.co:5432/postgres"

# Arrancar en desarrollo
pnpm dev
```

Tu app local se conectará a Supabase directamente.

---

## 📊 MCP Configuration (VS Code)

El archivo `.vscode/mcp.json` ya está creado con tu project reference:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=fpxqbiswfmcvrbfszgth"
    }
  }
}
```

Esto permite que VS Code se conecte directamente a tu proyecto de Supabase para:
- Ver y editar datos
- Ejecutar queries SQL
- Monitorear logs

---

## 🎯 Arquitectura Final

```
┌─────────────────┐
│   GitHub Repo   │
│   (fifa-vip)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         v                 v
┌────────────────┐  ┌──────────────┐
│  Render.com    │  │  Supabase    │
│  (Backend)     │──→  (Database)   │
│  - Express     │  │  - PostgreSQL │
│  - tRPC        │  │  - 500 MB     │
│  - Jobs        │  │  - Siempre    │
│  - Free/$7     │  │    activo     │
└────────────────┘  └──────────────┘
         │
         │ API
         v
   ┌──────────┐
   │  Users   │
   │ (Browser)│
   └──────────┘
```

**Ventajas de esta arquitectura:**
- ✅ Database GRATIS y siempre activa (Supabase)
- ✅ Backend puede estar en Render Free (con sleep) o Starter ($7)
- ✅ Sin límites de conexiones de base de datos
- ✅ Backups automáticos en Supabase
- ✅ Fácil escalabilidad

---

## 🔐 Configuración de Seguridad (Opcional pero Recomendado)

### 1. Habilitar Row Level Security (RLS)

En Supabase SQL Editor:

```sql
-- Permitir lectura pública de cache (dashboard público)
ALTER TABLE "newsCache" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON "newsCache" FOR SELECT USING (true);

ALTER TABLE "weatherCache" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON "weatherCache" FOR SELECT USING (true);

ALTER TABLE "matchesCache" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON "matchesCache" FOR SELECT USING (true);

-- Proteger tabla de usuarios
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only authenticated can read users" ON "users" FOR SELECT USING (auth.role() = 'authenticated');
```

### 2. Usar Service Role Key para Backend

En Supabase Settings → API:
- **anon key**: Para frontend (público)
- **service_role key**: Para backend (con permisos completos)

Usa `service_role` en la connection string del backend (Render):

```
postgresql://postgres.[SERVICE_ROLE]:[PASSWORD]@...
```

---

## 📈 Monitoreo y Logs

### Supabase Dashboard
- **Database** → Ver tamaño usado, conexiones activas
- **Logs** → Queries ejecutados, errores
- **API** → Requests por minuto

### Render Dashboard (si usas Render)
- **Logs** → Ver logs del servidor Express
- **Metrics** → CPU, RAM, requests

---

## 💡 Optimizaciones

### Reducir uso de base de datos
Si te acercas al límite de 500 MB:

```bash
# En Supabase SQL Editor, limpiar datos viejos
DELETE FROM "newsCache" WHERE "fetchedAt" < NOW() - INTERVAL '7 days';
DELETE FROM "matchesCache" WHERE "matchDate" < NOW() - INTERVAL '14 days';
```

### Cachear más agresivamente
En `server/jobs.ts`, aumentar intervalos:
- Noticias: cada 30 min (en vez de 15)
- Partidos: cada 10 min (en vez de 5)
- Clima: cada 30 min (en vez de 15)

---

## ❓ Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate que la contraseña no tenga caracteres especiales sin escapar
- Usa el formato: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`

### Error: "SSL connection required"
Supabase requiere SSL. La librería `postgres` lo maneja automáticamente, pero si tienes problemas:

```bash
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require"
```

### Migraciones no se aplican
Si `pnpm db:push` falla:
1. Ve a Supabase SQL Editor
2. Verifica que no existan tablas con el mismo nombre
3. Borra tablas manualmente si es necesario:
   ```sql
   DROP TABLE IF EXISTS "matchesCache";
   DROP TABLE IF EXISTS "weatherCache";
   DROP TABLE IF EXISTS "newsCache";
   DROP TABLE IF EXISTS "users";
   DROP TYPE IF EXISTS "role";
   ```
4. Vuelve a ejecutar `pnpm db:push`

### Render no puede conectar con Supabase
- Whitelist la IP de Render en Supabase (no necesario en plan Free)
- Verifica que `DATABASE_URL` esté configurada correctamente en Render Environment Variables

---

## 🚀 Despliegue Automático

Con esta configuración, cada `git push` a `master`:
1. GitHub Actions construye la imagen Docker (opcional)
2. Render detecta el cambio y redeploys automáticamente
3. Supabase mantiene la base de datos persistente

---

## 📊 Comparación: Supabase vs Otras Opciones

| Característica | Supabase + Render Free | PlanetScale + Render | Railway |
|----------------|------------------------|----------------------|---------|
| **Costo** | $0/mes | $0/mes | $5 créditos/mes |
| **Database** | 500 MB PostgreSQL | 5 GB MySQL | 1 GB PostgreSQL |
| **Backend sleep** | Sí (Render Free) | Sí | No |
| **Backups** | Automáticos (7 días) | No en Free | Sí |
| **Dashboard** | Excelente | Básico | Bueno |
| **Límites** | 500k requests | 1B rows reads | 500 horas compute |

**Recomendación:** Supabase + Render Free para empezar (100% gratis), luego actualizar a Render Starter ($7/mes) si necesitas que no se duerma.

---

## 🎉 Resultado Final

Tu dashboard estará disponible en:
- **URL Render**: `https://fifa-vip-dashboard.onrender.com`
- **Base de datos**: Siempre activa en Supabase
- **Costo total**: $0/mes (con sleep) o $7/mes (sin sleep)

---

## 📞 Soporte

- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs/get-started-postgresql

Si tienes problemas, revisa los logs en:
1. Supabase Dashboard → Logs
2. Render Dashboard → Logs
3. VS Code → MCP Supabase extension

---

## 🔄 Próximos Pasos (Opcional)

1. **Dominio personalizado** (gratis en Render)
2. **Supabase Auth** para proteger ciertas secciones
3. **Realtime subscriptions** para updates instantáneos
4. **Edge Functions** para procesamiento serverless
5. **Supabase Storage** para logos/imágenes de equipos
