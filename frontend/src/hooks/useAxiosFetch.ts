import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
export function useAxiosFetch<T>(url: string, enabled = true) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const reload = useCallback(async () => { if (!enabled) { setLoading(false); return; } setLoading(true); setError(''); try { const response = await api.get<T>(url); setData(response.data); } catch (cause: unknown) { const message = (cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not load this information'; setError(message); } finally { setLoading(false); } }, [url, enabled]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
