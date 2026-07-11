# AK OS v8.2 — Registro controlado de distribuidores

1. Ejecuta una sola vez el SQL común `supabase/ak_os_v8_2_distribuidores.sql`.
2. Copia el contenido del ZIP encima de `autokeys-file-service`.
3. Commit + push.

Los nuevos usuarios quedan bloqueados en la pantalla de revisión hasta ser aprobados desde Autokeys Core. Los usuarios antiguos sin solicitud mantienen el acceso para evitar bloquear cuentas existentes.
