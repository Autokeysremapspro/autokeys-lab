-- Browser-side Core login only needs to link auth_user_id and refresh ultimo_acceso.
-- Role/active/profile administration is handled by the protected admin API/service role.
REVOKE UPDATE ON public.usuarios_app FROM authenticated;
GRANT UPDATE (auth_user_id, ultimo_acceso) ON public.usuarios_app TO authenticated;
