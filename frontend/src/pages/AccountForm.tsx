import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { buildAccountName, generateAccountEmail, userSchema, type UserInput } from '../schemas/forms';
import { Page } from './Page';
import { Loading, ErrorState } from '../components/common/States';
import type { User } from '../types';
import { academicPrograms } from '../constants/academicPrograms';
import { notify } from '../context/ToastContext';

/**
 * Account form (coordinator only).
 * One form used for two jobs:
 *  - Create account (/accounts/new): name and email are generated automatically,
 *    and a temporary password is shown once after saving.
 *  - Edit account (/accounts/:id/edit): the existing details are loaded into the form.
 */
export function AccountForm() {
  // If the URL has an :id we are editing an existing account; otherwise we are creating one.
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  // Page state: loading is only true while fetching an account to edit.
  // error holds a message to show; temporaryPassword and createdEmail hold the new account's login details.
  const [loading, setLoading] = useState(edit);
  const [error, setError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  // Form setup: react-hook-form handles the inputs and Zod (userSchema) validates them.
  // New accounts start as a student.
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<UserInput>({ resolver: zodResolver(userSchema), defaultValues: { type: 'student' } });
  // watch() reads the current form values as the user types, so the page can react to them.
  const type = watch('type');
  const firstName = watch('firstName') || '';
  const middleName = watch('middleName') || '';
  const lastName = watch('lastName') || '';
  const selectedDepartment = watch('department') || '';
  // Build the email from the typed name and account type (shown read-only when creating).
  // The department select also keeps a saved value that is not in the standard list.
  const generatedEmail = generateAccountEmail(firstName, middleName, lastName, type);
  const isListedDepartment = academicPrograms.some(({ programs }) => (programs as readonly string[]).includes(selectedDepartment));

  // When editing, load the account from GET /users/:id and fill the form with its details.
  // Expertise tags are turned into a comma-separated string so they fit in one text box.
  useEffect(() => {
    if (!id) return;
    void api.get<User>(`/users/${id}`)
      .then(({ data }) => reset({ name: data.name, email: data.email, type: data.type, department: data.department || '', expertiseTags: data.expertiseTags?.join(', ') || '', canChair: data.canChair, maxDefensesPerDay: data.maxDefensesPerDay }))
      .catch((cause: unknown) => setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load account'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  // Runs when the form is submitted and passes validation.
  // Edit mode: PUT /users/:id, show a message, then go back to the Accounts list.
  // Create mode: POST /users, then show the generated email and temporary password.
  const submit = async (values: UserInput) => {
    setError('');
    // The first/middle/last name fields only exist in the form, so remove them from the data sent to the server.
    const { firstName: submittedFirstName, middleName: submittedMiddleName, lastName: submittedLastName, ...accountValues } = values;
    // When creating, build the full name and email from the name parts. When editing, keep the existing ones.
    // Expertise tags are split by commas and trimmed into a list, ignoring empty entries.
    const payload = {
      ...accountValues,
      name: edit ? values.name : buildAccountName(submittedFirstName || '', submittedMiddleName || '', submittedLastName || ''),
      email: edit ? values.email : generateAccountEmail(submittedFirstName || '', submittedMiddleName || '', submittedLastName || '', values.type),
      expertiseTags: values.expertiseTags?.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (id) {
        await api.put(`/users/${id}`, payload);
        notify('Account updated.');
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

  // While the account to edit is still loading, show a loading indicator instead of the form.
  if (loading) return <Loading />;

  // What the page shows:
  //  - Edit mode: full name and email inputs. Create mode: first, middle (optional) and last name
  //    inputs plus a read-only generated email.
  //  - Account type (cannot be changed while editing) and department / academic program.
  //  - For faculty and coordinators only: expertise tags, maximum defenses per day,
  //    and a checkbox for being eligible to chair defenses.
  //  - Cancel and Save/Create buttons, an error message if saving fails, and a card that
  //    shows the new account's credentials once. The password cannot be viewed again.
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
        <label>Generated email<input type="email" value={generatedEmail} readOnly placeholder="Complete first and last name to generate email" /><small className="muted">{type === 'coordinator' ? 'Coordinator accounts use @coordinator.com.' : type === 'faculty' ? 'Faculty accounts use @faculty.com.' : 'Student accounts use @student.com.'} Middle name adds its first initial.</small></label>
      </>}

      <label>Account type<select {...register('type')} disabled={edit}><option value="student">Student</option><option value="faculty">Faculty</option><option value="coordinator">Coordinator</option></select>{errors.type && <small className="field-error">{errors.type.message}</small>}</label>
      <label>Department / Academic program<select {...register('department')}>
        <option value="">Select a department or program</option>
        {selectedDepartment && !isListedDepartment && <option value={selectedDepartment}>{selectedDepartment}</option>}
        {academicPrograms.map(({ department, programs }) => <optgroup key={department} label={department}>
          {programs.map((program) => <option key={program} value={program}>{program}</option>)}
        </optgroup>)}
      </select></label>
      {type !== 'student' && <>
        <label><span className="field-label-row">Expertise tags <span className="muted">comma separated</span></span><input {...register('expertiseTags')} placeholder="software engineering, data science" /></label>
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