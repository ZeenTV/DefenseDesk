import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAxiosFetch } from '../hooks/useAxiosFetch';
import { Loading, ErrorState, EmptyState } from '../components/common/States';
import { Page } from './Page';
import type { User } from '../types';
import { notify } from '../context/ToastContext';
export function Accounts() {
  const { data, loading, error, reload } = useAxiosFetch<User[]>('/users');
  const remove = async (user: User) => { if (!window.confirm(`Delete the account for ${user.name}?`)) return; try { await api.delete(`/users/${user._id}`); await reload(); notify('Account deleted.'); } catch (cause: unknown) { notify((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Delete failed', 'error'); } };
  const toggleCoordinator = async (user: User) => { const enabled = user.roles?.includes('coordinator') || false; try { await api.patch(`/users/${user._id}/roles`, { coordinator: !enabled }); await reload(); notify('Coordinator privilege updated.'); } catch (cause: unknown) { notify((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Role update failed', 'error'); } };
  return <Page eyebrow="PEOPLE" title="Accounts" description="Create student and faculty access, and manage coordinator privileges." action={<Link className="button button-primary" to="/accounts/new">Add account</Link>}>{loading ? <Loading /> : error ? <ErrorState message={error} /> : !data?.length ? <EmptyState>No accounts have been created yet.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Privileges</th><th>Actions</th></tr></thead><tbody>{data.map((user) => <tr key={user._id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className="text-capitalize">{user.type}</span></td><td>{user.roles?.join(', ') || 'student'}</td><td className="row-actions"><Link to={`/accounts/${user._id}/edit`}>Edit</Link>{user.type === 'faculty' && <button className="link-button" onClick={() => void toggleCoordinator(user)}>{user.roles?.includes('coordinator') ? 'Revoke coordinator' : 'Grant coordinator'}</button>}<button className="link-button danger-link" onClick={() => void remove(user)}>Delete</button></td></tr>)}</tbody></table></div>}</Page>;
}
