# Autokeys Lab

ERP interno para Autokeys Lab: clientes, vehículos, expedientes/OT, facturas, stock y file service.

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local` copiando `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

3. Ejecuta en local:

```bash
npm run dev
```

4. En Supabase crea usuarios desde Authentication > Users.

5. Para Vercel, sube el proyecto a GitHub y añade las mismas variables de entorno.

## Tablas necesarias

Usa el SQL completo que ya ejecutaste en Supabase.

## Primera versión incluida

- Login con Supabase Auth
- Dashboard
- Clientes
- Vehículos
- Expedientes / OT
- Facturas / Presupuestos / Albaranes / Tickets
- Stock
- File Service
- Tema oscuro negro/rojo Autokeys Lab
