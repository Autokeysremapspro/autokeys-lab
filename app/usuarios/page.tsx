'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import FormModal from '@/components/FormModal'
import { UsuariosService, type UsuarioApp, type UsuarioRol } from '@/lib/services/usuarios'
import toast from 'react-hot-toast'
import { ShieldCheck, UserPlus, Users, Wrench, Briefcase, Globe2, Crown, Pencil, Trash2, KeyRound, Link2, Link2Off } from 'lucide-react'

const roles: { value: UsuarioRol; label: string; desc: string; icon: any }[] = [
  { value: 'admin', label: 'Admin', desc: 'Acceso completo', icon: Crown },
  { value: 'laboratorio', label: 'Laboratorio', desc: 'OT, ECU, llaves, archivos y stock', icon: Wrench },
  { value: 'administracion', label: 'Administración', desc: 'Clientes, vehículos, estados y facturación', icon: Briefcase },
  { value: 'distribuidor', label: 'Distribuidor', desc: 'File Service y documentos propios', icon: Globe2 },
]

const emptyForm = {
  nombre: '',
  email: '',
  telefono: '',
  rol: 'laboratorio' as UsuarioRol,
  activo: true,
  password: '',
  confirmPassword: '',
}

function roleBadge(rol: string) {
  const base = 'badge '
  if (rol === 'admin') return base + 'bg-red-600/20 text-red-300 border border-red-500/30'
  if (rol === 'laboratorio') return base + 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
  if (rol === 'administracion') return base + 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
  return base + 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UsuarioApp | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setUsuarios(await UsuariosService.getAll())
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return usuarios
    return usuarios.filter(u =>
      `${u.nombre} ${u.email} ${u.telefono || ''} ${u.rol}`.toLowerCase().includes(q)
    )
  }, [usuarios, query])

  function newUser() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function editUser(user: UsuarioApp) {
    setEditing(user)
    setForm({
      nombre: user.nombre || '',
      email: user.email || '',
      telefono: user.telefono || '',
      rol: user.rol || 'laboratorio',
      activo: user.activo ?? true,
      password: '',
      confirmPassword: '',
    })
    setOpen(true)
  }

  async function save(e: any) {
    e.preventDefault()
    try {
      setSaving(true)

      if (!form.nombre?.trim() || !form.email?.trim()) {
        toast.error('Nombre y email son obligatorios')
        return
      }

      const wantsPassword = !!form.password || !!form.confirmPassword

      if (!editing || wantsPassword) {
        if (!form.password || form.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          return
        }
        if (form.password !== form.confirmPassword) {
          toast.error('Las contraseñas no coinciden')
          return
        }
      }

      if (editing) {
        await UsuariosService.update(editing.id, {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          rol: form.rol,
          activo: form.activo,
        })

        if (wantsPassword) {
          await UsuariosService.resetPassword(editing.id, form.password)
        }

        toast.success(wantsPassword ? 'Usuario actualizado y acceso Auth preparado' : 'Usuario actualizado')
      } else {
        await UsuariosService.create({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          rol: form.rol,
          activo: form.activo,
          password: form.password,
        })
        toast.success('Usuario creado con acceso al software')
      }

      setOpen(false)
      setForm(emptyForm)
      setEditing(null)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'Error guardando usuario')
    } finally {
      setSaving(false)
    }
  }

  async function remove(user: UsuarioApp) {
    if (!confirm(`¿Eliminar el usuario ${user.nombre}? También se intentará eliminar su acceso de Supabase Auth.`)) return
    try {
      await UsuariosService.remove(user.id)
      toast.success('Usuario eliminado')
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar')
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Seguridad y acceso</p>
          <h2 className="text-3xl font-black mt-1">Usuarios</h2>
          <p className="text-zinc-500 mt-2">Crea usuarios, asigna roles y define la contraseña inicial de acceso.</p>
        </div>
        <button onClick={newUser} className="btn btn-red flex items-center gap-2 justify-center">
          <UserPlus size={18} /> Nuevo usuario
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {roles.map(r => {
          const Icon = r.icon
          const count = usuarios.filter(u => u.rol === r.value).length
          return (
            <div key={r.value} className="card p-5">
              <div className="flex items-center justify-between">
                <Icon size={22} className="text-red-400" />
                <span className="text-2xl font-black">{count}</span>
              </div>
              <div className="font-black mt-4">{r.label}</div>
              <div className="text-sm text-zinc-500 mt-1">{r.desc}</div>
            </div>
          )
        })}
      </div>

      <div className="card p-5 mb-6 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex gap-3">
          <ShieldCheck className="text-emerald-300 shrink-0" />
          <div>
            <div className="font-black text-emerald-100">Acceso con Supabase Auth</div>
            <p className="text-sm text-zinc-400 mt-1">
              Al crear un usuario se genera también su cuenta de acceso con email y contraseña. Para que funcione, añade en Vercel la variable <b>SUPABASE_SERVICE_ROLE_KEY</b> con la Secret Key de Supabase.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Users className="text-red-400" />
            <h3 className="text-xl font-black">Usuarios internos</h3>
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o rol..."
            className="w-full md:w-96"
          />
        </div>

        {loading ? (
          <div className="text-zinc-500 py-10 text-center">Cargando usuarios...</div>
        ) : filtered.length === 0 ? (
          <div className="text-zinc-500 py-10 text-center">No hay usuarios internos todavía.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Auth</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td><b>{user.nombre}</b></td>
                    <td className="text-zinc-400">{user.email}</td>
                    <td className="text-zinc-400">{user.telefono || '—'}</td>
                    <td><span className={roleBadge(user.rol)}>{user.rol}</span></td>
                    <td>{user.activo ? <span className="badge bg-emerald-500/15 text-emerald-300">Activo</span> : <span className="badge bg-zinc-500/15 text-zinc-400">Bloqueado</span>}</td>
                    <td>{user.auth_user_id ? <span className="badge bg-emerald-500/15 text-emerald-300 inline-flex items-center gap-1"><Link2 size={13} /> Vinculado</span> : <span className="badge bg-amber-500/15 text-amber-300 inline-flex items-center gap-1"><Link2Off size={13} /> Sin acceso</span>}</td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => editUser(user)} className="btn btn-dark flex items-center gap-2"><Pencil size={15} /> Editar</button>
                        <button onClick={() => remove(user)} className="btn bg-red-950/40 border border-red-500/20 text-red-300 flex items-center gap-2"><Trash2 size={15} /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <input required placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={form.activo ? 'true' : 'false'} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}>
            <option value="true">Activo</option>
            <option value="false">Bloqueado</option>
          </select>
          <div className="md:col-span-2 grid md:grid-cols-2 gap-3 rounded-2xl border border-white/10 p-4 bg-black/20">
            <div className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
              <KeyRound size={16} className="text-red-400" /> {editing ? (editing.auth_user_id ? 'Cambiar contraseña opcional' : 'Crear acceso Auth con contraseña') : 'Contraseña de acceso'}
            </div>
            <input
              type="password"
              required={!editing}
              placeholder={editing ? 'Nueva contraseña opcional' : 'Contraseña'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <input
              type="password"
              required={!editing}
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            />
            <p className="md:col-span-2 text-xs text-zinc-500">Mínimo 6 caracteres. Si el usuario antiguo no tiene Auth vinculado, al guardar contraseña se creará y vinculará automáticamente.</p>
          </div>
          <button disabled={saving} className="btn btn-red md:col-span-2 disabled:opacity-50">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario con acceso'}</button>
        </form>
      </FormModal>
    </AppShell>
  )
}
