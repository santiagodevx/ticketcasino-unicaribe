import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Ticket, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

/* ── Modal: crear empleado ── */
function CreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ document: '', name: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.document || !form.name || !form.username || !form.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await api.createEmployee(form);
      toast.success('Empleado registrado correctamente');
      onCreated();
      onClose();
      setForm({ document: '', name: '', username: '', password: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Empleado</DialogTitle>
          <DialogDescription>
            Crea el perfil del empleado con sus credenciales de acceso para su celular
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Nombre completo</label>
            <Input autoFocus placeholder="Ej: Juan Carlos Pérez" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Cédula / Documento</label>
            <Input placeholder="Ej: 1045678901" value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Usuario para la app</label>
            <Input placeholder="Ej: jperez" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Contraseña</label>
            <Input type="password" placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Crear Empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal: editar empleado ── */
function EditModal({ open, employee, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: employee?.name ?? '',
    username: employee?.username ?? '',
    password: '',
    active: employee?.active ?? true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({ name: employee.name, username: employee.username ?? '', password: '', active: employee.active });
    }
  }, [employee]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, username: form.username, active: form.active };
      if (form.password.trim()) payload.password = form.password.trim();
      await api.updateEmployee(employee.id, payload);
      toast.success('Empleado actualizado');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empleado</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Documento</label>
            <Input value={employee.document} disabled className="opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Nombre completo</label>
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Usuario</label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Nueva contraseña (opcional)</label>
            <Input type="password" placeholder="Dejar en blanco para conservar la actual"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="active-check"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded accent-[#F59E0B]"
            />
            <label htmlFor="active-check" className="text-sm text-[#94A3B8] cursor-pointer select-none">
              Empleado activo en el sistema
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 size={14} className="spin" /> Guardando...</> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchList = async () => {
      try {
        const data = await api.getEmployees();
        if (!ignore) setEmployees(data);
      } catch (err) {
        if (!ignore) toast.error(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchList();
    return () => { ignore = true; };
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.document.includes(search) ||
      (e.username && e.username.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#F1F5F9]">Empleados</h2>
        <p className="text-sm text-[#64748B]">Gestión del personal y sus credenciales de acceso</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="sm:max-w-xs"
          placeholder="Buscar por nombre, usuario o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Nuevo empleado
        </Button>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#64748B]">
            <Loader2 size={18} className="spin" /> Cargando empleados...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#64748B]">
            <Users size={36} strokeWidth={1.5} />
            <p className="text-sm">{search ? 'Sin resultados para tu búsqueda' : 'No hay empleados registrados aún'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs text-[#64748B] uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium">Usuario</th>
                  <th className="px-5 py-3 text-left font-medium">Documento</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-left font-medium">Creado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#F1F5F9]">{emp.name}</td>
                    <td className="px-5 py-3 font-mono text-[#F59E0B] text-xs">@{emp.username}</td>
                    <td className="px-5 py-3 font-mono text-[#64748B] text-xs">{emp.document}</td>
                    <td className="px-5 py-3">
                      <Badge variant={emp.active ? 'success' : 'danger'}>
                        {emp.active ? '● Activo' : '● Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[#64748B] text-xs">
                      {new Date(emp.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm"
                          onClick={() => navigate(`/employees/${emp.id}`)}>
                          <Ticket size={12} /> Ver tickets
                        </Button>
                        <Button variant="secondary" size="sm"
                          onClick={() => setEditing(emp)}>
                          <Edit2 size={12} /> Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      <EditModal open={!!editing} employee={editing} onClose={() => setEditing(null)} onUpdated={load} />
    </div>
  );
}
