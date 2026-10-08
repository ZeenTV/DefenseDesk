import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useAxiosFetch } from '../hooks/useAxiosFetch';
import { Loading, ErrorState, EmptyState } from '../components/common/States';
import { Page } from './Page';
import type { Defense, Evaluation } from '../types';
import { evaluationSchema, type EvaluationInput } from '../schemas/forms';
import { notify } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function Assignments() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAxiosFetch<Defense[]>('/defenses/mine');
  const [active, setActive] = useState<Defense | null>(null);
  const [serverError, setServerError] = useState('');
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation[]>>({});
  const [evaluationErrors, setEvaluationErrors] = useState<Record<string, string>>({});
  const [evaluationLoading, setEvaluationLoading] = useState<Record<string, boolean>>({});
  const [evaluationOpen, setEvaluationOpen] = useState<Record<string, boolean>>({});
  const form = useForm<EvaluationInput>({ resolver: zodResolver(evaluationSchema), defaultValues: { scores: [{ criterion: '', score: 0 }], remarks: '' } });
  const scoreFields = useFieldArray({ control: form.control, name: 'scores' });

  const loadEvaluations = async (defense: Defense) => {
    setEvaluationLoading((current) => ({ ...current, [defense._id]: true }));
    setEvaluationErrors((current) => ({ ...current, [defense._id]: '' }));
    try {
      const { data: rows } = await api.get<Evaluation[]>(`/defenses/${defense._id}/evaluations`);
      setEvaluations((current) => ({ ...current, [defense._id]: rows }));
      return rows;
    } catch (cause: unknown) {
      setEvaluationErrors((current) => ({ ...current, [defense._id]: (cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load evaluations' }));
      return null;
    } finally {
      setEvaluationLoading((current) => ({ ...current, [defense._id]: false }));
    }
  };

  const toggleEvaluationView = async (defense: Defense) => {
    const isOpen = !evaluationOpen[defense._id];
    setEvaluationOpen((current) => ({ ...current, [defense._id]: isOpen }));
    if (isOpen && evaluations[defense._id] === undefined) await loadEvaluations(defense);
  };

  const beginEvaluation = async (defense: Defense) => {
    setServerError('');
    const rows = evaluations[defense._id] ?? await loadEvaluations(defense);
    if (!rows) return;
    if (rows.some((item) => item.panelist._id === user?._id)) {
      notify('You have already submitted an evaluation for this defense.', 'info');
      return;
    }
    form.reset({ scores: [{ criterion: '', score: 0 }], remarks: '' });
    setActive(defense);
  };

  const submit = async (values: EvaluationInput) => {
    if (!active) return;
    setServerError('');
    try {
      await api.post<Evaluation>('/evaluations', { defense: active._id, scores: values.scores, remarks: values.remarks });
      setEvaluationOpen((current) => ({ ...current, [active._id]: true }));
      await loadEvaluations(active);
      setActive(null);
      form.reset();
      await reload();
      notify('Evaluation submitted.');
    } catch (cause: unknown) {
      setServerError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Evaluation failed');
    }
  };

  return <Page eyebrow="PANELIST VIEW" title="My assignments" description="Review your defense schedule and submit one evaluation per assigned defense." action={<Link className="button button-quiet" to="/dashboard">← Back</Link>}>
    {loading ? <Loading /> : error ? <ErrorState message={error} /> : !data?.length ? <EmptyState>You do not have any assigned defenses.</EmptyState> : <div className="assignment-list">
      {data.map((defense) => {
        const submitted = evaluations[defense._id]?.some((item) => item.panelist._id === user?._id) || false;
        return <article className="assignment-card" key={defense._id}>
          <div className="assignment-date"><strong>{new Date(defense.startTime).toLocaleDateString(undefined, { day: '2-digit' })}</strong><span>{new Date(defense.startTime).toLocaleDateString(undefined, { month: 'short' })}</span></div>
          <div className="assignment-main">
            <span className="eyebrow">{defense.group.projectArea} · {defense.room.name}</span>
            <h2>{defense.group.title}</h2>
            <p>{new Date(defense.startTime).toLocaleTimeString()} · Chair {defense.chair.name}</p>
            <span className="status-pill">{defense.status}</span>
            <div className="row-actions">
              <button className="link-button" type="button" onClick={() => void toggleEvaluationView(defense)}>{evaluationOpen[defense._id] ? 'Hide evaluations' : 'View evaluations'}</button>
              <button className="link-button" type="button" disabled={submitted} onClick={() => void beginEvaluation(defense)}>{submitted ? 'Evaluation submitted' : 'Submit evaluation'}</button>
            </div>
            {evaluationLoading[defense._id] && <div className="evaluation-empty">Loading evaluations…</div>}
            {evaluationErrors[defense._id] && <div className="evaluation-empty evaluation-error" role="alert">{evaluationErrors[defense._id]} <button className="link-button" type="button" onClick={() => void loadEvaluations(defense)}>Try again</button></div>}
            {evaluationOpen[defense._id] && !evaluationLoading[defense._id] && !evaluationErrors[defense._id] && evaluations[defense._id]?.length === 0 && <div className="evaluation-empty">No evaluations have been submitted for this defense yet.</div>}
            {evaluationOpen[defense._id] && !evaluationLoading[defense._id] && evaluations[defense._id]?.map((item) => <div className="evaluation-review" key={item._id}><strong>{item.panelist.name}</strong>{item.scores.map((score) => <span key={`${item._id}-${score.criterion}`}>{score.criterion}: {score.score}</span>)}{item.remarks && <small>{item.remarks}</small>}</div>)}
          </div>
        </article>;
      })}
    </div>}
    {active && createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
      <section className="modal-card evaluation-modal" role="dialog" aria-modal="true" aria-labelledby="eval-title">
        <button type="button" className="modal-close" onClick={() => setActive(null)} aria-label="Close">×</button>
        <span className="eyebrow">EVALUATION</span>
        <h2 id="eval-title">{active.group.title}</h2>
        <p>Enter one or more criteria and score each from 0 to 100.</p>
        <form className="form-stack" onSubmit={form.handleSubmit(submit)}>
          {scoreFields.fields.map((field, index) => {
            const scoreRegistration = form.register(`scores.${index}.score`);
            return <div className="score-row" key={field.id}>
              <label>Criterion<input {...form.register(`scores.${index}.criterion`)} placeholder="Enter criterion name" />{form.formState.errors.scores?.[index]?.criterion && <small className="field-error">{form.formState.errors.scores[index]?.criterion?.message}</small>}</label>
              <label>Score from 0 to 100<input {...scoreRegistration} type="number" min="0" max="100" onChange={(event) => {
                if (event.currentTarget.value !== '' && Number(event.currentTarget.value) > 100) event.currentTarget.value = '100';
                void scoreRegistration.onChange(event);
              }} />{form.formState.errors.scores?.[index]?.score && <small className="field-error">{form.formState.errors.scores[index]?.score?.message}</small>}</label>
              {scoreFields.fields.length > 1 && <button type="button" className="link-button danger-link score-remove" onClick={() => scoreFields.remove(index)}>Remove</button>}
            </div>;
          })}
          <button type="button" className="button button-quiet" onClick={() => scoreFields.append({ criterion: '', score: 0 })}>Add criterion</button>
          <label>Remarks<textarea rows={3} {...form.register('remarks')} /></label>
          {serverError && <ErrorState message={serverError} />}
          <button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Submitting…' : 'Submit evaluation'}</button>
        </form>
      </section>
    </div>, document.body)}
  </Page>;
}
