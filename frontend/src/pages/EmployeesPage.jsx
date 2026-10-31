import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Ticket, Edit2 } from 'lucide-react';
import { api } from '../api';
import { toast } from '../components/Toast';

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    document: '',
    name: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.document || !form.name || !form.username || !form.password) {
      toast.err('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await api.createEmployee(form);
      toast.ok('Empleado registrado correctamente');
      onCreated();
      onClose();
    } catch (err) {
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo Empleado</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Crea el perfil del empleado con sus credenciales de acceso para su celular
        </p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              autoFocus
              placeholder="Ej: Juan Carlos Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Cédula / Documento</label>
            <input
              placeholder="Ej: 1045678901"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Usuario para la app</label>
            <input
              placeholder="Ej: jperez"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="flex-gap" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Empleado'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ employee, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: employee.name,
    username: employee.username || '',
    password: '',
    active: employee.active,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        active: form.active,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      await api.updateEmployee(employee.id, payload);
      toast.ok('Empleado actualizado');
      onUpdated();
      onClose();
    } catch (err) {
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar Empleado</h3>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Documento</label>
            <input value={employee.document} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="form-group">
            <label>Nombre completo</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Usuario</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Nueva contraseña (opcional)</label>
            <input
              type="password"
              placeholder="Dejar en blanco para conservar la actual"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="active"
              style={{ width: 'auto' }}
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label
              htmlFor="active"
              style={{ marginBottom: 0, textTransform: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              Empleado activo en el sistema
            </label>
          </div>

          <div className="flex-gap" style={{ marginTop: 14 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
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
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchList = async () => {
      try {
        const data = await api.getEmployees();
        if (!ignore) setEmployees(data);
      } catch (err) {
        if (!ignore) toast.err(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchList();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.document.includes(search) ||
      (e.username && e.username.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <div className="page-header">
        <h2>Empleados</h2>
        <p>Gestión del personal y sus credenciales de acceso</p>
      </div>

      <div className="flex-between toolbar-row">
        <input
          className="search-input"
          placeholder="Buscar por nombre, usuario o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <UserPlus size={16} /> Nuevo empleado
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Cargando empleados...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="icon">
              <Users size={32} color="var(--text-muted)" />
            </div>
            <p>
              {search
                ? 'Sin resultados para tu búsqueda'
                : 'No hay empleados registrados aún'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Documento</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                      @{emp.username}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {emp.document}
                    </td>
                    <td>
                      <span className={`badge ${emp.active ? 'green' : 'red'}`}>
                        {emp.active ? '● Activo' : '● Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(emp.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Ticket size={13} /> Ver tickets
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditing(emp)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
      {editing && (
        <EditModal
          employee={editing}
          onClose={() => setEditing(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
