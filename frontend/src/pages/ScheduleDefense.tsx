import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { defenseSchema, type DefenseInput } from '../schemas/forms';
import { Page } from './Page';
import { ErrorState, Loading } from '../components/common/States';
import type { Defense, Group, Room, User } from '../types';
import { notify } from '../context/ToastContext';

interface Suggestion { chair: User | null; members: User[]; eligibleFaculty: (User & { expertiseOverlap: number; currentWorkload: number })[]; }
const localInputValue = (date: string) => new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function ScheduleDefense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<DefenseInput>({ resolver: zodResolver(defenseSchema), defaultValues: { members: [] } });
  const groupId = watch('group');
  const dateValue = watch('startTime');
  const selectedMembers = watch('members') || [];
  const selectedChair = watch('chair');
  const selectedGroup = groups.find((group) => group._id === groupId);
  const panelFaculty = faculty.filter((person) => person._id !== selectedGroup?.adviser._id);
  const memberOptions = panelFaculty.filter((person) => person._id !== selectedChair);

  useEffect(() => {
    void Promise.all([
      api.get<Group[]>('/groups'), api.get<Room[]>('/rooms'), api.get<User[]>('/users'),
      id ? api.get<Defense>(`/defenses/${id}`) : Promise.resolve(null),
    ]).then(([g, r, u, d]) => {
      setGroups(g.data.filter((group) => group.status === 'pending' || group._id === d?.data.group._id));
      setRooms(r.data);
      setFaculty(u.data.filter((person) => person.type === 'faculty' && person.isActive));
      if (d) {
        const value = d.data;
        setValue('group', value.group._id);
        setValue('room', value.room._id);
        setValue('chair', value.chair._id);
        setValue('members', value.members.map((member) => member._id));
        setValue('startTime', localInputValue(value.startTime));
        setValue('endTime', localInputValue(value.endTime));
      }
    }).catch((cause: unknown) => setServerError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load scheduling options')).finally(() => setLoading(false));
  }, [id, setValue]);

  useEffect(() => {
    if (groupId) void api.get<Suggestion>(`/groups/${groupId}/panel-suggestions`).then(({ data }) => setSuggestions(data)).catch((cause: unknown) => setServerError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load suggestions'));
    else setSuggestions(null);
  }, [groupId]);

  useEffect(() => {
    if (dateValue) void api.get(`/defenses/availability?date=${encodeURIComponent(dateValue.slice(0, 10))}`).then(({ data }) => { if (data.message) setServerError(data.message); }).catch(() => undefined);
  }, [dateValue]);

  const toggleMember = (memberId: string) => {
    const nextMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter((value) => value !== memberId)
      : [...selectedMembers, memberId];
    setValue('members', nextMembers, { shouldDirty: true, shouldValidate: true });
  };

  const applySuggestions = () => {
    if (!suggestions) return;
    const chairId = suggestions.chair?._id || selectedChair;
    if (chairId) setValue('chair', chairId, { shouldDirty: true, shouldValidate: true });
    setValue('members', suggestions.members.map((person) => person._id).filter((memberId) => memberId !== chairId), { shouldDirty: true, shouldValidate: true });
  };

  const submit = async (values: DefenseInput) => {
    setServerError('');
    const payload = { group: values.group, room: values.room, chair: values.chair, members: values.members, startTime: new Date(values.startTime).toISOString(), endTime: new Date(values.endTime).toISOString() };
    try {
      if (id) await api.put(`/defenses/${id}`, payload);
      else await api.post('/defenses', payload);
      notify(id ? 'Defense updated successfully.' : 'Defense scheduled successfully.');
      navigate('/defenses');
    } catch (cause: unknown) {
      setServerError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not schedule defense');
    }
  };

  if (loading) return <Loading />;

  return <Page eyebrow="SCHEDULING" title={id ? 'Update a defense' : 'Schedule a defense'} description="Choose a project, a conflict-free time, and a qualified panel.">
    <form className="form-card form-stack" onSubmit={handleSubmit(submit)}>
      <label>Capstone group<select {...register('group')}><option value="">Select a group</option>{groups.map((group) => <option key={group._id} value={group._id}>{group.title} · adviser {group.adviser.name}</option>)}</select>{errors.group && <small className="field-error">{errors.group.message}</small>}</label>
      {suggestions && <aside className="suggestion-box"><div className="section-title"><div><span className="eyebrow">PANEL SUGGESTIONS</span><h2>Suggested faculty</h2></div><button className="button button-quiet" type="button" onClick={applySuggestions}>Use suggestions</button></div><div className="tag-row">{suggestions.chair && <span>Chair: {suggestions.chair.name}</span>}{suggestions.members.map((person) => <span key={person._id}>Member: {person.name}</span>)}</div><p>Suggestions rank expertise overlap, then current scheduled workload. They are optional: choose any active faculty for panel members. Chairs must be chair-eligible. The adviser cannot serve; the server checks conflicts and daily limits when you save.</p></aside>}
      <div className="form-two"><label>Date and time<input type="datetime-local" {...register('startTime')} />{errors.startTime && <small className="field-error">{errors.startTime.message}</small>}</label><label>End time<input type="datetime-local" {...register('endTime')} />{errors.endTime && <small className="field-error">{errors.endTime.message}</small>}</label></div>
      <label>Room<select {...register('room')}><option value="">Select a room</option>{rooms.map((room) => <option key={room._id} value={room._id}>{room.name}</option>)}</select>{errors.room && <small className="field-error">{errors.room.message}</small>}</label>
      <div className="form-two">
        <label>Chair<select {...register('chair', { onChange: (event) => { const chairId = event.target.value; setValue('members', selectedMembers.filter((memberId) => memberId !== chairId), { shouldDirty: true, shouldValidate: true }); } })}><option value="">Select chair</option>{panelFaculty.filter((person) => person.canChair).map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select>{errors.chair && <small className="field-error">{errors.chair.message}</small>}</label>
        <div className="field-wrap"><label htmlFor="panel-member-select">Panel member</label><p className="field-hint">Choose one or more faculty. Click names to add or remove them.</p>
          <div className="panel-member-select">
            <button id="panel-member-select" type="button" className="panel-member-trigger" aria-haspopup="listbox" aria-expanded={panelMenuOpen} onClick={() => setPanelMenuOpen((open) => !open)}>
              <span>{selectedMembers.length ? `${selectedMembers.length} selected · ${selectedMembers.map((memberId) => panelFaculty.find((person) => person._id === memberId)?.name).filter(Boolean).join(', ')}` : 'Select faculty'}</span><span aria-hidden="true">▾</span>
            </button>
            {panelMenuOpen && <div className="panel-member-menu" role="listbox" aria-multiselectable="true" aria-labelledby="panel-member-select">
              {memberOptions.map((person) => {
                const selected = selectedMembers.includes(person._id);
                return <button key={person._id} type="button" className={`panel-member-option${selected ? ' selected' : ''}`} role="option" aria-selected={selected} onClick={() => toggleMember(person._id)}><span>{person.name}</span><span className="panel-member-check" aria-hidden="true">{selected ? '✓' : ''}</span></button>;
              })}
              {!memberOptions.length && <p className="panel-member-empty">No eligible faculty available.</p>}
              <div className="panel-member-menu-footer"><span>{selectedMembers.length} selected</span><button type="button" className="button button-quiet" onClick={() => setPanelMenuOpen(false)}>Done</button></div>
            </div>}
          </div>
          {errors.members && <small className="field-error">{errors.members.message}</small>}
        </div>
      </div>
      {serverError && <ErrorState message={serverError} />}
      <div className="form-actions"><Link className="button button-quiet" to="/defenses">Cancel</Link><button className="button button-primary" disabled={isSubmitting}>{id ? 'Update defense' : 'Schedule defense'}</button></div>
    </form>
  </Page>;
}
