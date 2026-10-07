import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Shell } from './components/layout/Shell';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { AccountForm } from './pages/AccountForm';
import { Groups } from './pages/Groups';
import { GroupForm } from './pages/GroupForm';
import { Rooms } from './pages/Rooms';
import { Defenses } from './pages/Defenses';
import { ScheduleDefense } from './pages/ScheduleDefense';
import { Assignments } from './pages/Assignments';
import { MyDefense } from './pages/MyDefense';
import { NotFound } from './pages/NotFound';
import { Loading } from './components/common/States';
function Guard({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && location.pathname !== '/password') return <Navigate to="/password" replace />;
  if (roles && !roles.some((role) => role === user.type || user.roles?.includes(role))) return <Navigate to="/dashboard" replace />;
  return children;
}
export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route element={<Guard><Shell /></Guard>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/accounts" element={<Guard roles={['coordinator']}><Accounts /></Guard>} />
    <Route path="/accounts/new" element={<Guard roles={['coordinator']}><AccountForm /></Guard>} />
    <Route path="/accounts/:id/edit" element={<Guard roles={['coordinator']}><AccountForm /></Guard>} />
    <Route path="/groups" element={<Guard roles={['coordinator']}><Groups /></Guard>} />
    <Route path="/groups/new" element={<Guard roles={['coordinator']}><GroupForm /></Guard>} />
    <Route path="/groups/:id/edit" element={<Guard roles={['coordinator']}><GroupForm /></Guard>} />
    <Route path="/defenses" element={<Guard roles={['coordinator']}><Defenses /></Guard>} />
    <Route path="/defenses/new" element={<Guard roles={['coordinator']}><ScheduleDefense /></Guard>} />
    <Route path="/defenses/:id/edit" element={<Guard roles={['coordinator']}><ScheduleDefense /></Guard>} />
    <Route path="/rooms" element={<Guard roles={['coordinator']}><Rooms /></Guard>} />
    <Route path="/assignments" element={<Guard roles={['faculty']}><Assignments /></Guard>} />
    <Route path="/my-defense" element={<Guard roles={['student']}><MyDefense /></Guard>} />
    <Route path="/password" element={<PasswordPage />} />
  </Route><Route path="*" element={<NotFound />} /></Routes>;
}
function PasswordPage() { return <Guard><PasswordPageContent /></Guard>; }
import { PasswordPageContent } from './pages/PasswordPage';
