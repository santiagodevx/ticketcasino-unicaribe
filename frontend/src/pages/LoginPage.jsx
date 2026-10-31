import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { toast } from '../components/Toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('employee'); // 'employee' | 'admin'
  const [employeeForm, setEmployeeForm] = useState({ username: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    if (!employeeForm.username.trim() || !employeeForm.password.trim()) {
      toast.err('Ingresa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const data = await api.employeeLogin({
        username: employeeForm.username.trim(),
        password: employeeForm.password.trim(),
      });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', 'EMPLOYEE');
      localStorage.setItem('employeeData', JSON.stringify(data.employee));
      toast.ok(`¡Bienvenido, ${data.employee.name}!`);
      navigate('/portal');
    } catch (err) {
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(adminForm);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', 'ADMIN');
      toast.ok('Sesión de administrador iniciada');
      navigate('/');
    } catch (err) {
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="login-brand-card">
            <img src="/logo.png" alt="TicketCasino" className="login-logo-img" />
            <h1 className="brand-title login-brand-title">
              <span className="brand-ticket">Ticket</span>
              <span className="brand-casino">Casino</span>
            </h1>
          </div>
          <p className="sub" style={{ marginTop: 12 }}>Sistema Digital de Alimentación</p>
        </div>

        {/* Pestañas para elegir tipo de acceso */}
        <div
          className="tabs"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 20,
            display: 'flex',
          }}
        >
          <button
            type="button"
            className={`tab ${mode === 'employee' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center', padding: '10px' }}
            onClick={() => setMode('employee')}
          >
            📱 Soy Empleado
          </button>
          <button
            type="button"
            className={`tab ${mode === 'admin' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center', padding: '10px' }}
            onClick={() => setMode('admin')}
          >
            🛡️ Administrador
          </button>
        </div>

        {mode === 'employee' ? (
          <form className="card" onSubmit={handleEmployeeLogin}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Acceso para Empleados</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Ingresa con tu usuario y contraseña asignados
              </p>
            </div>

            <div className="form-group">
              <label>Usuario o Cédula</label>
              <input
                autoFocus
                placeholder="Ej: jperez o 1045678901"
                value={employeeForm.username}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, username: e.target.value })
                }
                style={{ fontSize: 15, padding: '11px 14px' }}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={employeeForm.password}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, password: e.target.value })
                }
                style={{ fontSize: 15, padding: '11px 14px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 10,
                padding: '12px',
                fontSize: 14,
              }}
              disabled={loading}
            >
              {loading ? 'Verificando...' : '📱 Entrar a Mis Tickets'}
            </button>
          </form>
        ) : (
          <form className="card" onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Panel de Administración</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Acceso restringido a operadores del casino
              </p>
            </div>

            <div className="form-group">
              <label>Usuario Administrador</label>
              <input
                autoFocus
                placeholder="admin"
                value={adminForm.username}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, username: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
