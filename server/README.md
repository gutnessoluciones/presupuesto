# Servidor para Presupuesto (GutNes)

Este pequeño servidor guarda presupuestos y un logotipo en una base de datos SQLite.

Pasos para instalar y arrancar:

1. Abrir PowerShell en `c:\Users\Gabriel\Downloads\Visual\presupuesto\server`
2. Instalar dependencias:

```powershell
npm install
```

3. Arrancar el servidor:

```powershell
npm start
```

El servidor escuchará por defecto en `http://localhost:3000`.

Endpoints relevantes:
- `GET /api/health` — healthcheck.
- `GET /api/budgets` — obtener todos los presupuestos.
- `POST /api/budgets` — crear o actualizar un presupuesto (payload completo JSON, debe incluir `id`).
- `DELETE /api/budgets/:id` — borrar presupuesto.
- `GET /api/logo` — obtener logo global.
- `POST /api/logo` — subir logo global (JSON { "logo": "data:image/png;base64,..." }).

El frontend intentará sincronizar automáticamente con el servidor si está disponible. Si no desea usar el servidor, la aplicación sigue funcionando con `localStorage`.
