import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { passwordSchema, type PasswordInput } from '../schemas/forms';
import { Page } from './Page';
export function PasswordPageContent() {
  const { setUser } = useAuth(); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });
  const submit = async ({ currentPassword, newPassword }: PasswordInput) => { setMessage(''); setError(''); try { const response = await api.patch('/auth/password', { currentPassword, newPassword }); setUser(response.data.user); setMessage('Password changed successfully.'); navigate('/dashboard'); } catch (cause: unknown) { setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not change password'); } };
  return <Page title="Change your password" description="Choose a new password to secure your account."><form className="form-card form-stack narrow-form" onSubmit={handleSubmit(submit)}>{(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((key) => <label key={key}>{key === 'currentPassword' ? 'Current password' : key === 'newPassword' ? 'New password' : 'Confirm new password'}<input type="password" {...register(key)} />{errors[key] && <small className="field-error">{errors[key]?.message}</small>}</label>)}{message && <div className="success-message">{message}</div>}{error && <div className="inline-error">{error}</div>}<button className="button button-primary" disabled={isSubmitting}>Update password</button></form></Page>;
}
