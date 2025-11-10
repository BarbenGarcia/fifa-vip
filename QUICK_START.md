# 🚀 Despliegue Rápido - FIFA VIP Dashboard

## ✅ Mejor Opción: Supabase (GRATIS)

**Por qué Supabase es perfecto:**
- ✅ Base de datos PostgreSQL (500 MB) GRATIS
- ✅ Siempre activo (sin "sleep")
- ✅ Backups automáticos
- ✅ MCP integration para VS Code
- ✅ Sin tarjeta de crédito requerida

---

## 📋 Checklist Rápido

### 1️⃣ Crear cuenta en Supabase
- Ir a [supabase.com](https://supabase.com)
- Sign up con GitHub (gratis)
- Create new project: `fifa-vip-dashboard`
- Guardar la contraseña de la base de datos

### 2️⃣ Obtener connection string
- Settings → Database → Connection string (URI)
- Formato: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
- Reemplazar `[PASSWORD]` con tu contraseña

### 3️⃣ Migrar base de datos
```bash
export DATABASE_URL="tu-connection-string-aqui"
pnpm db:push
```

### 4️⃣ Desplegar backend (Render)
- Ir a [render.com](https://render.com)
- New Web Service → Conectar repo `fifa-vip`
- Configurar variables:
  - `DATABASE_URL`: connection string de Supabase
  - `NEWS_API_KEY`: tu key de NewsAPI.org
  - `FOOTBALL_DATA_API_KEY`: tu key de Football-Data.org
- Deploy! (automático con `render.yaml`)

### 5️⃣ ¡Listo!
Tu app estará en: `https://fifa-vip-dashboard.onrender.com`

---

## 💰 Costos

| Plan | Costo | Ventajas | Desventajas |
|------|-------|----------|-------------|
| **Supabase Free + Render Free** | **$0/mes** | Todo gratis | Backend se duerme tras 15 min |
| **Supabase Free + Render Starter** | **$7/mes** | Siempre activo | Costo mensual bajo |

**Recomendación:** Empezar con todo gratis, actualizar a Render Starter si necesitas 0 latencia.

---

## 🔗 Documentación Detallada

- **Guía completa Supabase**: `SUPABASE_DEPLOYMENT.md`
- **Guía alternativa Render+PlanetScale**: `DEPLOYMENT.md`
- **Instrucciones para AI**: `.github/copilot-instructions.md`

---

## ⚡ Comandos Útiles

```bash
# Desarrollo local (conecta a Supabase)
export DATABASE_URL="postgresql://..."
pnpm dev

# Migraciones
pnpm db:push

# Build para producción
pnpm build

# Producción local
pnpm start

# Docker
docker compose up -d --build
```

---

## 🆘 Problemas Comunes

### "Cannot connect to database"
→ Verifica que `DATABASE_URL` esté correcta y tenga la contraseña

### "News API not working"
→ Añade `NEWS_API_KEY` en variables de entorno

### "Render app muy lenta"
→ Es el cold start (30s) del plan Free, actualiza a Starter ($7) para eliminar

### "Matches no aparecen"
→ Verifica `FOOTBALL_DATA_API_KEY` y que no hayas superado el límite de requests

---

## 📊 Arquitectura

```
GitHub (fifa-vip)
        ↓
    Render.com
    (Express + tRPC)
        ↓
    Supabase
    (PostgreSQL)
```

---

## 🎯 URLs Importantes

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **NewsAPI**: https://newsapi.org
- **Football Data**: https://www.football-data.org

---

## ✨ Bonus: MCP en VS Code

El proyecto ya incluye `.vscode/mcp.json` para conectar VS Code directamente a Supabase:
- Ver tablas y datos
- Ejecutar queries SQL
- Monitorear logs

Reinicia VS Code después de crear el proyecto en Supabase para activarlo.

---

**¿Preguntas?** Lee la guía completa en `SUPABASE_DEPLOYMENT.md`
