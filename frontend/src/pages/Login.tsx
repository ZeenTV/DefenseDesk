import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginInput } from '../schemas/forms';
export function Login() {
  const { setUser } = useAuth(); const navigate = useNavigate(); const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = async (values: LoginInput) => { setServerError(''); try { const response = await api.post('/auth/login', values); setUser(response.data.user); navigate(response.data.user.mustChangePassword ? '/password' : '/dashboard'); } catch (cause: unknown) { setServerError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unable to sign in'); } };
  return <main className="login-layout"><Link to="/" className="brand login-brand"><img className="brand-mark" src="/logo.png" alt="" />DefenseDesk</Link><section className="login-card"><div className="eyebrow">WELCOME BACK</div><h1>Sign in to continue</h1><p>Your defense workspace is ready when you are.</p><form onSubmit={handleSubmit(submit)} className="form-stack"><label>Email address<input {...register('email')} type="email" autoComplete="username" placeholder="name@nu-clark.edu.ph" />{errors.email && <small className="field-error">{errors.email.message}</small>}</label><label>Password<input {...register('password')} type="password" autoComplete="current-password" placeholder="Enter your password" />{errors.password && <small className="field-error">{errors.password.message}</small>}</label>{serverError && <div className="inline-error" role="alert">{serverError}</div>}<button className="button button-primary button-wide" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button></form><div className="login-note">Accounts are provided by your capstone coordinator.</div></section><span className="login-foot">DefenseDesk · NU Clark</span></main>;
}
