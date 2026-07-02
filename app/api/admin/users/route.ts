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

async function findAuthUserByEmail(admin: ReturnType<typeof getAdminClient>, email: string) {
  const target = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const found = data.users.find(user => user.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < 100) return null
  }
  return null
}

async function createOrGetAuthUser(admin: ReturnType<typeof getAdminClient>, params: {
  email: string
  password: string
  nombre: string
  rol: string
}) {
  const { email, password, nombre, rol } = params

  const existing = await findAuthUserByEmail(admin, email)
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { nombre, rol },
      app_metadata: { rol },
    })
    if (error) throw error
    return data.user
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
    app_metadata: { rol },
  })

  if (error) throw error
  return data.user
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
    const authUser = await createOrGetAuthUser(admin, { email, password, nombre, rol })

    const { data: usuario, error: profileError } = await admin
      .from('usuarios_app')
      .upsert({
        auth_user_id: authUser.id,
        nombre,
        email,
        telefono,
        rol,
        activo,
      }, { onConflict: 'email' })
      .select('*')
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ usuario })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creando usuario' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const nombre = String(body.nombre || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const telefono = body.telefono || null
    const rol = body.rol || 'laboratorio'
    const activo = body.activo ?? true

    if (!id || !nombre || !email) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: perfilActual, error: perfilActualError } = await admin
      .from('usuarios_app')
      .select('auth_user_id,email')
      .eq('id', id)
      .single()

    if (perfilActualError) return NextResponse.json({ error: perfilActualError.message }, { status: 400 })

    if (perfilActual?.auth_user_id) {
      const { error: authError } = await admin.auth.admin.updateUserById(perfilActual.auth_user_id, {
        email,
        user_metadata: { nombre, rol },
        app_metadata: { rol },
      })
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { data: usuario, error } = await admin
      .from('usuarios_app')
      .update({ nombre, email, telefono, rol, activo })
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ usuario })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error actualizando usuario' }, { status: 500 })
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
      .select('*')
      .eq('id', id)
      .single()

    if (perfilError) return NextResponse.json({ error: perfilError.message }, { status: 400 })
    if (!perfil?.email) return NextResponse.json({ error: 'El usuario no tiene email válido' }, { status: 400 })

    if (!perfil.auth_user_id) {
      const authUser = await createOrGetAuthUser(admin, {
        email: perfil.email,
        password,
        nombre: perfil.nombre,
        rol: perfil.rol || 'laboratorio',
      })

      const { error: linkError } = await admin
        .from('usuarios_app')
        .update({ auth_user_id: authUser.id })
        .eq('id', id)

      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 })

      return NextResponse.json({ ok: true, linked: true })
    }

    const { error: authError } = await admin.auth.admin.updateUserById(perfil.auth_user_id, {
      password,
      user_metadata: { nombre: perfil.nombre, rol: perfil.rol },
      app_metadata: { rol: perfil.rol },
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    return NextResponse.json({ ok: true, linked: false })
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
