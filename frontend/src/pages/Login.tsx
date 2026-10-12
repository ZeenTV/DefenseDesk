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
  return
