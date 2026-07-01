import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const nombre = String(body.nombre || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const rol = body.rol || 'laboratorio'
    const activo = body.activo ?? true
    const telefono = body.telefono || null

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        rol,
      },
      app_metadata: {
        rol,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const authUserId = authData.user?.id

    const { data: usuario, error: profileError } = await admin
      .from('usuarios_app')
      .upsert({
        auth_user_id: authUserId,
        nombre,
        email,
        telefono,
        rol,
        activo,
      }, { onConflict: 'email' })
      .select('*')
      .single()

    if (profileError) {
      if (authUserId) await admin.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ usuario })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creando usuario' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const password = String(body.password || '')

    if (!id || !password) {
      return NextResponse.json({ error: 'Faltan usuario o contraseña' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: perfil, error: perfilError } = await admin
      .from('usuarios_app')
      .select('auth_user_id,email')
      .eq('id', id)
      .single()

    if (perfilError) return NextResponse.json({ error: perfilError.message }, { status: 400 })
    if (!perfil?.auth_user_id) return NextResponse.json({ error: 'Este usuario no tiene cuenta Auth vinculada' }, { status: 400 })

    const { error: authError } = await admin.auth.admin.updateUserById(perfil.auth_user_id, {
      password,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error actualizando contraseña' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const admin = getAdminClient()

    const { data: perfil, error: perfilError } = await admin
      .from('usuarios_app')
      .select('auth_user_id')
      .eq('id', id)
      .single()

    if (perfilError) return NextResponse.json({ error: perfilError.message }, { status: 400 })

    if (perfil?.auth_user_id) {
      const { error: authError } = await admin.auth.admin.deleteUser(perfil.auth_user_id)
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: deleteError } = await admin.from('usuarios_app').delete().eq('id', id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error eliminando usuario' }, { status: 500 })
  }
}
