import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Shield, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('employee'); // 'employee' | 'admin'
  const [employeeForm, setEmployeeForm] = useState({ username: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    if (!employeeForm.username.trim() || !employeeForm.password.trim()) {
      toast.error('Ingresa tu usuario y contraseña');
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
      toast.success(`¡Bienvenido, ${data.employee.name}!`);
      navigate('/portal');
    } catch (err) {
      toast.error(err.message);
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
      toast.success('Sesión de administrador iniciada');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B10] p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10141D] border border-white/10 shadow-xl">
              <img src="/logo.png" alt="TicketCasino" className="h-10 w-10 rounded-xl object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#F1F5F9]">Ticket</span>
            <span className="text-[#D97706]">Casino</span>
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">Sistema Digital de Alimentación</p>
        </div>

        {/* Tab switcher */}
        <div className="mb-4 flex rounded-xl bg-[#10141D] border border-white/[0.07] p-1">
          <button
            type="button"
            onClick={() => setMode('employee')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              mode === 'employee'
                ? 'bg-[#F59E0B] text-[#090B10] font-semibold'
                : 'text-[#64748B] hover:text-[#F1F5F9]'
            )}
          >
            <Smartphone size={15} /> Empleado
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              mode === 'admin'
                ? 'bg-[#F59E0B] text-[#090B10] font-semibold'
                : 'text-[#64748B] hover:text-[#F1F5F9]'
            )}
          >
            <Shield size={15} /> Administrador
          </button>
        </div>

        {/* Employee form */}
        {mode === 'employee' ? (
          <Card>
            <CardContent>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-[#F1F5F9]">Acceso para Empleados</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Ingresa con tu usuario y contraseña asignados
                </p>
              </div>

              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    Usuario o Cédula
                  </label>
                  <Input
                    autoFocus
                    placeholder="Ej: jperez o 1045678901"
                    value={employeeForm.username}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, username: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={employeeForm.password}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, password: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="spin" size={16} /> Verificando...</>
                  ) : (
                    <><LogIn size={16} /> Entrar a Mis Tickets</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-[#F1F5F9]">Panel de Administración</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Acceso restringido a operadores del casino
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    Usuario Administrador
                  </label>
                  <Input
                    autoFocus
                    placeholder="admin"
                    value={adminForm.username}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, username: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="spin" size={16} /> Ingresando...</>
                  ) : (
                    <><LogIn size={16} /> Iniciar Sesión</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
