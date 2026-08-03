-- AK Cloud — Ajuste de precios de catálogo (subida a nivel de mercado)
--
-- Referencia usada: DIAGCAR (file service profesional español, mismo
-- segmento B2B que AK Cloud) cobraba en 2026 ~99€ Stage 1, ~33-62€ EGR OFF,
-- ~62-78€ DPF OFF, ~74€ AdBlue OFF / Pops&Bangs. Los precios de aquí abajo
-- se quedan en torno al 60-70% de esa referencia — competitivos, pero ya
-- no "sospechosamente baratos".
--
-- Solo actualiza precio y créditos (el nombre/icono/orden no se tocan).
-- Si no existe el slug en tu tabla (por ejemplo si ya lo renombraste),
-- esa fila simplemente no se actualiza — no da error.
--
-- IMPORTANTE: revisa antes de ejecutar si has cambiado estos precios ya
-- desde el admin — este script sobreescribe lo que haya ahora mismo.

update akcloud_servicios set precio = 65,  creditos = 65  where slug = 'stage-1';
update akcloud_servicios set precio = 95,  creditos = 95  where slug = 'stage-2';
update akcloud_servicios set precio = 55,  creditos = 55  where slug = 'dpf-off';
update akcloud_servicios set precio = 40,  creditos = 40  where slug = 'egr-off';
update akcloud_servicios set precio = 60,  creditos = 60  where slug = 'adblue-off';
update akcloud_servicios set precio = 65,  creditos = 65  where slug = 'immo-off';
update akcloud_servicios set precio = 50,  creditos = 50  where slug = 'pops-bangs';
update akcloud_servicios set precio = 35,  creditos = 35  where slug = 'hardcut';

-- Comprueba el resultado:
select nombre, slug, precio, creditos from akcloud_servicios order by orden;
