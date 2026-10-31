import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import ValidatePage from './pages/ValidatePage';
import EmployeePortalPage from './pages/EmployeePortalPage';

function AdminLayout({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) return <Navigate to="/login" replace />;
  if (role === 'EMPLOYEE') return <Navigate to="/portal" replace />;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

function EmployeeRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/portal"
          element={
            <EmployeeRoute>
              <EmployeePortalPage />
            </EmployeeRoute>
          }
        />
        <Route
          path="/"
          element={
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/employees"
          element={
            <AdminLayout>
              <EmployeesPage />
            </AdminLayout>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <AdminLayout>
              <EmployeeDetailPage />
            </AdminLayout>
          }
        />
        <Route
          path="/validate"
          element={
            <AdminLayout>
              <ValidatePage />
            </AdminLayout>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
