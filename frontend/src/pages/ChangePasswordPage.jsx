import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

// Ajusta esta ruta a la de tu portal del empleado
const PORTAL_ROUTE = "/portal";

function PasswordField({ id, label, value, onChange, autoComplete, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`w-full rounded-lg border bg-surface2 px-3 py-2.5 pr-10 text-sm text-text outline-none transition focus:ring-2 focus:ring-primary/40 ${
            error ? "border-red-500/60" : "border-white/[0.07]"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-text"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("employeeData");
    if (!stored) {
      navigate("/login");
      return;
    }
    setEmployee(JSON.parse(stored));
  }, [navigate]);

  const forced = !!employee?.mustChangePassword;

  const validate = () => {
    const next = {};
    if (!forced && !currentPassword)
      next.currentPassword = "Ingresa tu contraseña actual.";
    if (newPassword.length < 6)
      next.newPassword = "Debe tener al menos 6 caracteres.";
    else if (!forced && newPassword === currentPassword)
      next.newPassword = "Debe ser diferente a la actual.";
    if (confirmPassword !== newPassword)
      next.confirmPassword = "Las contraseñas no coinciden.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await api.changePassword(
        forced ? { newPassword } : { currentPassword, newPassword },
      );

      // Actualiza el empleado guardado para que el modal obligatorio desaparezca
      const stored = JSON.parse(localStorage.getItem("employeeData") || "{}");
      localStorage.setItem(
        "employeeData",
        JSON.stringify({ ...stored, mustChangePassword: false }),
      );

      toast.success("Contraseña actualizada con éxito");
      navigate(PORTAL_ROUTE);
    } catch (err) {
      toast.error(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("employeeData");
    navigate("/login");
  };

  if (!employee) return null;

  return (
    <div className="flex min-h-screen items-center bg-bg p-4">
      <div className="mx-auto w-full max-w-sm space-y-5">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TicketCasino"
            className="size-7 rounded-md object-cover"
          />
          <span className="text-base font-bold">
            <span className="text-text">Ticket</span>
            <span className="text-primary-dark">Casino</span>
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={15} className="text-primary" /> Cambiar contraseña
            </CardTitle>
            <p className="text-xs leading-relaxed text-muted">
              {forced
                ? "Por seguridad, debes definir una nueva contraseña antes de continuar."
                : "Elige una contraseña nueva para tu cuenta."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!forced && (
                <PasswordField
                  id="currentPassword"
                  label="Contraseña actual"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                  error={errors.currentPassword}
                />
              )}
              <PasswordField
                id="newPassword"
                label="Nueva contraseña"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                error={errors.newPassword}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                error={errors.confirmPassword}
              />

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={15} className="spin" /> Guardando...
                  </>
                ) : (
                  "Guardar contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {forced ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut size={14} /> Cerrar sesión
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => navigate(PORTAL_ROUTE)}
          >
            Volver
          </Button>
        )}
      </div>
    </div>
  );
}
