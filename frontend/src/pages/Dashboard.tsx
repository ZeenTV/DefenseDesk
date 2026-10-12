import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAxiosFetch } from '../hooks/useAxiosFetch';
import { Loading, ErrorState } from '../components/common/States';
import { Page } from './Page';
interface Stats { defensesPerDay: Record<string, number>; averageScorePerCriterion: Record<string, number>; passRate: number; passingMark: number; panelistLoad: { user: { _id: string; name: string }; defenseCount: number }[]; }
export function Dashboard() {
  const { user, activeView } = useAuth(); const coordinator = Boolean(user?.roles?.includes('coordinator') && activeView === 'coordinator'); const { data, loading, error } = useAxiosFetch<Stats>('/stats/overview', coordinator);
  if (!coordinator) return <Page eyebrow="YOUR WORKSPACE" title={`Welcome, ${user?.name.split(' ')[0]}`} description="Choose the view for your role to continue."><div className="tile-grid"><Link className="action-tile" to={user?.type === 'student' ? '/my-defense' : '/assignments'}><span className="tile-icon">↗</span><h2>{user?.type === 'student' ? 'My defense' : 'My assignments'}</h2><p>{user?.type === 'student' ? 'View your group schedule, panel, status and result.' : 'Review assigned defenses and submit evaluations.'}</p></Link>{user?.type === 'faculty' && <Link className="action-tile" to="/assignments"><span className="tile-icon">◷</span><h2>Panelist workspace</h2><p>See upcoming assignments and evaluation status.</p></Link>}</div></Page>;
  return
}
