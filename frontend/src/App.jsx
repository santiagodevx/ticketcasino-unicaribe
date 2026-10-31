import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
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
    <div className="flex min-h-screen bg-[#090B10]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[240px] p-6 lg:p-8 min-h-screen">
        {children}
      </main>
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
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#10141D',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F1F5F9',
          },
        }}
      />
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
