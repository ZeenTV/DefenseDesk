import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAxiosFetch } from '../hooks/useAxiosFetch';
import { Loading, ErrorState, EmptyState } from '../components/common/States';
import { Page } from './Page';
import type { Group } from '../types';
import { notify } from '../context/ToastContext';
export function Groups() {
  const { data, loading, error, reload } = useAxiosFetch<Group[]>('/groups');
  const remove = async (group: Group) => { if (!window.confirm(`Delete the group “${group.title}”?`)) return; try { await api.delete(`/groups/${group._id}`); await reload(); notify('Group deleted.'); } catch (cause: unknown) { notify((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Delete failed', 'error'); } };
  return <Page eyebrow="CAPSTONE PROJECTS" title="Groups" description="Manage members, advisers, and project areas." action={<Link className="button button-primary" to="/groups/new">Create group</Link>}>{loading ? <Loading /> : error ? <ErrorState message={error} /> : !data?.length ? <EmptyState>No capstone groups yet.</EmptyState> : <div className="card-grid">{data.map((group) => <article className="group-card" key={group._id}><div className="card-topline"><span className="status-pill">{group.status}</span><span>{group.members.length} students</span></div><h2>{group.title}</h2><p>{group.projectArea}</p><div className="person-line"><span className="avatar">{group.adviser.name.slice(0, 1)}</span><span>Advised by <strong>{group.adviser.name}</strong></span></div><div className="card-actions"><Link to={`/groups/${group._id}/edit`}>Edit group</Link><button className="link-button danger-link" onClick={() => void remove(group)}>Delete</button></div></article>)}</div>}</Page>;
}
