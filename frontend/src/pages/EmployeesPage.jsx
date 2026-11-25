import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Ticket,
  Edit2,
  Loader2,
  Upload,
  FileText,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

/* ── Modal: importar CSV ── */
function ImportCsvModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toast.error("Solo se permiten archivos con extensión .csv");
        return;
      }
      if (selected.size > 2 * 1024 * 1024) {
        toast.error("El archivo excede el tamaño máximo de 2 MB");
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Selecciona un archivo CSV");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.importEmployeesCsv(formData);
      setResult(res);
      toast.success(
        `Importación completada: ${res.created} empleado(s) creados`,
      );
      onImported();
    } catch (err) {
      toast.error(err.message || "Error al importar archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Empleados desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo .csv con las columnas{" "}
            <code className="text-primary">name</code> y{" "}
            <code className="text-primary">document</code>.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={submit} className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                file
                  ? "border-primary/50 bg-primary/5"
                  : "border-white/10 bg-white/2 hover:border-white/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileText className="text-primary" size={36} />
                  <span className="text-sm font-semibold break-all text-text">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted">
                    {(file.size / 1024).toFixed(1)} KB — Clic para cambiar
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="text-muted" size={36} />
                  <span className="text-sm font-medium text-text">
                    Haz clic para seleccionar tu archivo CSV
                  </span>
                  <span className="text-xs text-muted">Máximo 2 MB (.csv)</span>
                </div>
              )}
            </div>

            <div className="space-y-1 rounded-lg border border-white/5 bg-white/3 p-3 text-xs text-[#94A3B8]">
              <p className="font-semibold text-text">
                Formato esperado del CSV:
              </p>
              <p className="font-mono text-primary-dark">
                document,name,active
              </p>
              <p className="font-mono text-muted">
                1045678901,Juan Carlos Pérez,true
              </p>
              <p className="pt-1 text-[11px] text-muted">
                * La contraseña inicial asignada será el mismo número de
                documento.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 size={14} className="spin" /> Importando...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Importar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-white/5 bg-white/2 p-3">
                <span className="block text-xs text-muted">Total filas</span>
                <span className="text-lg font-bold text-text">
                  {result.total}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <span className="block text-xs text-emerald-400">Creados</span>
                <span className="text-lg font-bold text-emerald-400">
                  {result.created}
                </span>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <span className="block text-xs text-amber-400">Omitidos</span>
                <span className="text-lg font-bold text-amber-400">
                  {result.skipped}
                </span>
              </div>
            </div>

            {result.alreadyInDb?.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-amber-400">
                  <AlertTriangle size={13} /> Ya registrados en la BD (
                  {result.alreadyInDb.length}):
                </span>
                <p className="max-h-24 overflow-y-auto rounded-sm border border-white/5 bg-white/2 p-2 font-mono break-all text-muted">
                  {result.alreadyInDb.join(", ")}
                </p>
              </div>
            )}

            {result.duplicatedInFile?.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-amber-400">
                  <AlertCircle size={13} /> Duplicados en el archivo (
                  {result.duplicatedInFile.length}):
                </span>
                <p className="max-h-24 overflow-y-auto rounded-sm border border-white/5 bg-white/2 p-2 font-mono break-all text-muted">
                  {result.duplicatedInFile.join(", ")}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={resetState}>
                Importar otro archivo
              </Button>
              <Button type="button" onClick={handleClose}>
                Finalizar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal: crear empleado ── */
function CreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    document: "",
    name: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.document || !form.name || !form.username || !form.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      await api.createEmployee(form);
      toast.success("Empleado registrado correctamente");
      onCreated();
      onClose();
      setForm({ document: "", name: "", username: "", password: "" });
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
            Crea el perfil del empleado con sus credenciales de acceso para su
            celular
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Nombre completo
            </label>
            <Input
              autoFocus
              placeholder="Ej: Juan Carlos Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Cédula / Documento
            </label>
            <Input
              placeholder="Ej: 1045678901"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Usuario para la app
            </label>
            <Input
              placeholder="Ej: jperez"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} className="spin" /> Guardando...
                </>
              ) : (
                "Crear Empleado"
              )}
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
    name: employee?.name ?? "",
    username: employee?.username ?? "",
    password: "",
    active: employee?.active ?? true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        username: employee.username ?? "",
        password: "",
        active: employee.active,
      });
    }
  }, [employee]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        active: form.active,
      };
      if (form.password.trim()) payload.password = form.password.trim();
      await api.updateEmployee(employee.id, payload);
      toast.success("Empleado actualizado");
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
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Documento
            </label>
            <Input value={employee.document} disabled className="opacity-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Nombre completo
            </label>
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Usuario
            </label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
              Nueva contraseña (opcional)
            </label>
            <Input
              type="password"
              placeholder="Dejar en blanco para conservar la actual"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="active-check"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="size-4  rounded-sm accent-primary"
            />
            <label
              htmlFor="active-check"
              className="cursor-pointer text-sm text-[#94A3B8] select-none"
            >
              Empleado activo en el sistema
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} className="spin" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
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
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text sm:text-2xl">Empleados</h2>
          <p className="text-sm text-muted">
            Gestión del personal y sus credenciales de acceso
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
          <Button
            variant="secondary"
            className="h-10 w-full justify-center px-3.5 font-medium shadow-sm hover:border-white/20 sm:w-auto"
            onClick={() => setShowImport(true)}
          >
            <Upload size={16} className="text-primary" />
            <span className="truncate">Importar CSV</span>
          </Button>
          <Button
            className="h-10 w-full justify-center px-4 font-semibold shadow-sm shadow-primary/10 hover:shadow-primary/20 sm:w-auto"
            onClick={() => setShowCreate(true)}
          >
            <UserPlus size={16} />
            <span className="truncate">Nuevo empleado</span>
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Input
          className="h-10 w-full border-white/8 bg-surface pl-3.5 focus:border-primary/50 sm:max-w-md"
          placeholder="Buscar por nombre, usuario o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Employees list */}
      {loading ? (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-center gap-3 py-16 text-muted">
            <Loader2 size={18} className="spin" /> Cargando empleados...
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
            <Users size={36} strokeWidth={1.5} />
            <p className="text-sm">
              {search
                ? "Sin resultados para tu búsqueda"
                : "No hay empleados registrados aún"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Vista móvil: Cards compactas para evitar desborde de pantalla */}
          <div className="space-y-3 md:hidden">
            {filtered.map((emp) => (
              <Card key={emp.id} className="space-y-3 border-white/[0.07] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">
                      {emp.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      {emp.username ? (
                        <span className="font-mono text-primary">
                          @{emp.username}
                        </span>
                      ) : null}
                      <span className="font-mono text-muted">
                        C.C. {emp.document}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={emp.active ? "success" : "danger"}
                    className="shrink-0"
                  >
                    {emp.active ? "● Activo" : "● Inactivo"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-muted">
                  <span>
                    Registrado:{" "}
                    {new Date(emp.createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <Ticket size={13} /> Ver tickets
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setEditing(emp)}
                  >
                    <Edit2 size={13} /> Editar
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Vista desktop / tablet: Tabla completa */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs tracking-wider text-muted uppercase">
                    <th className="px-5 py-3 text-left font-medium">Nombre</th>
                    <th className="px-5 py-3 text-left font-medium">Usuario</th>
                    <th className="px-5 py-3 text-left font-medium">
                      Documento
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Estado</th>
                    <th className="px-5 py-3 text-left font-medium">Creado</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className="transition-colors hover:bg-white/2"
                    >
                      <td className="px-5 py-3 font-semibold text-text">
                        {emp.name}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-primary">
                        {emp.username ? `@${emp.username}` : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {emp.document}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={emp.active ? "success" : "danger"}>
                          {emp.active ? "● Activo" : "● Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {new Date(emp.createdAt).toLocaleDateString("es-CO")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/employees/${emp.id}`)}
                          >
                            <Ticket size={12} /> Ver tickets
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditing(emp)}
                          >
                            <Edit2 size={12} /> Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <CreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
      <ImportCsvModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={load}
      />
      <EditModal
        open={!!editing}
        employee={editing}
        onClose={() => setEditing(null)}
        onUpdated={load}
      />
    </div>
  );
}
