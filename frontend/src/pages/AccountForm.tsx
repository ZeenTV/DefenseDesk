import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { buildAccountName, generateAccountEmail, userSchema, type UserInput } from '../schemas/forms';
import { Page } from './Page';
import { Loading, ErrorState } from '../components/common/States';
import type { User } from '../types';

export function AccountForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(edit);
  const [error, setError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<UserInput>({ resolver: zodResolver(userSchema), defaultValues: { type: 'student' } });
  const type = watch('type');
  const firstName = watch('firstName') || '';
  const middleName = watch('middleName') || '';
  const lastName = watch('lastName') || '';
  const generatedEmail = generateAccountEmail(firstName, middleName, lastName);

  useEffect(() => {
    if (!id) return;
    void api.get<User>(`/users/${id}`)
      .then(({ data }) => reset({ name: data.name, email: data.email, type: data.type, department: data.department || '', expertiseTags: data.expertiseTags?.join(', ') || '', canChair: data.canChair, maxDefensesPerDay: data.maxDefensesPerDay }))
      .catch((cause: unknown) => setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load account'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const submit = async (values: UserInput) => {
    setError('');
    const { firstName: submittedFirstName, middleName: submittedMiddleName, lastName: submittedLastName, ...accountValues } = values;
    const payload = {
      ...accountValues,
      name: edit ? values.name : buildAccountName(submittedFirstName || '', submittedMiddleName || '', submittedLastName || ''),
      email: edit ? values.email : generateAccountEmail(submittedFirstName || '', submittedMiddleName || '', submittedLastName || ''),
      expertiseTags: values.expertiseTags?.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (id) {
        await api.put(`/users/${id}`, payload);
        window.alert('Account updated.');
        navigate('/accounts');
      } else {
        const { data } = await api.post('/users', payload);
        setCreatedEmail(data.user.email);
        setTemporaryPassword(data.temporaryPassword);
      }
    } catch (cause: unknown) {
      setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not save account');
    }
  };

  if (loading) return <Loading />;

  return <Page eyebrow="ACCOUNT MANAGEMENT" title={edit ? 'Edit account' : 'Create account'} description="Accounts are provisioned by a coordinator and sign in with a temporary password.">
    <form className="form-card form-stack" onSubmit={handleSubmit(submit)}>
      {edit ? <div className="form-two">
        <label>Full name<input {...register('name')} />{errors.name && <small className="field-error">{errors.name.message}</small>}</label>
        <label>Email<input type="email" {...register('email')} />{errors.email && <small className="field-error">{errors.email.message}</small>}</label>
      </div> : <>
        <div className="form-three">
          <label>First name<input autoComplete="given-name" {...register('firstName')} />{errors.firstName && <small className="field-error">{errors.firstName.message}</small>}</label>
          <label><span>Middle name <span className="muted">(Optional)</span></span><input autoComplete="additional-name" {...register('middleName')} /></label>
          <label>Last name<input autoComplete="family-name" {...register('lastName')} />{errors.lastName && <small className="field-error">{errors.lastName.message}</small>}</label>
        </div>
        <label>Generated email<input type="email" value={generatedEmail} readOnly placeholder="Complete first and last name to generate email" /><small className="muted">Generated automatically for students and faculty. Middle name adds its first initial.</small></label>
      </>}

      <label>Account type<select {...register('type')} disabled={edit}><option value="student">Student</option><option value="faculty">Faculty</option></select>{errors.type && <small className="field-error">{errors.type.message}</small>}</label>
      {type === 'faculty' && <>
        <label>Department<input {...register('department')} /></label>
        <label>Expertise tags <span className="muted">comma separated</span><input {...register('expertiseTags')} placeholder="software engineering, data science" /></label>
        <div className="form-two">
          <label>Maximum defenses per day<input type="number" min="1" max="6" {...register('maxDefensesPerDay')} />{errors.maxDefensesPerDay && <small className="field-error">{errors.maxDefensesPerDay.message}</small>}</label>
          <label className="check-label"><input type="checkbox" {...register('canChair')} /> Eligible to chair defenses</label>
        </div>
      </>}
      <div className="form-actions"><Link className="button button-quiet" to="/accounts">Cancel</Link><button className="button button-primary" disabled={isSubmitting}>{edit ? 'Save changes' : 'Create account'}</button></div>
      {error && <ErrorState message={error} />}
      {temporaryPassword && <div className="credential-card"><strong>New account created · credentials shown once</strong><span>Email</span><code>{createdEmail}</code><span>Temporary password</span><code>{temporaryPassword}</code><p>Copy these credentials now. The temporary password will not be shown again.</p><button type="button" className="button button-primary" onClick={() => navigate('/accounts')}>Done</button></div>}
    </form>
  </Page>;
}
