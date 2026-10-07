import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const nav = [{ to: '/dashboard', label: 'Overview' }, { to: '/accounts', label: 'Accounts', view: 'coordinator' }, { to: '/groups', label: 'Groups', view: 'coordinator' }, { to: '/defenses', label: 'Defenses', view: 'coordinator' }, { to: '/rooms', label: 'Rooms', view: 'coordinator' }, { to: '/assignments', label: 'My assignments', view: 'panelist' }, { to: '/my-defense', label: 'My defense', view: 'student' }];
export function Shell() {
  const { user, setUser, activeView, setActiveView } = useAuth(); const navigate = useNavigate();
  const coordinator = user?.roles?.includes('coordinator');
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setUser(null); navigate('/login'); } };
  const switchView = (view: 'coordinator' | 'panelist') => { setActiveView(view); navigate('/dashboard'); };
  return <div className="app-shell"><header className="topbar"><Link className="brand" to="/dashboard"><img className="brand-mark" src="/logo.png" alt="" />DefenseDesk</Link><nav className="nav-links">{nav.filter((item) => item.view === 'coordinator' ? coordinator && activeView === 'coordinator' : item.view === 'panelist' ? user?.type === 'faculty' && activeView === 'panelist' : item.view === 'student' ? user?.type === 'student' : true).map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}</nav><div className="user-menu"><span>{user?.name}</span>{coordinator && <><button className={`role-chip role-switch ${activeView === 'coordinator' ? 'selected' : ''}`} onClick={() => switchView('coordinator')}>Coordinator view</button><button className={`role-chip role-switch ${activeView === 'panelist' ? 'selected' : ''}`} onClick={() => switchView('panelist')}>Panelist view</button></>}<button className="button button-quiet" onClick={logout}>Log out</button></div></header><main className="page-wrap"><Outlet /></main></div>;
}
