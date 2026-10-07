export function Loading({ label = 'Loading' }: { label?: string }) { return <div className="state-card" role="status"><span className="spinner" />{label}</div>; }
export function ErrorState({ message }: { message: string }) { return <div className="state-card error-state" role="alert">{message}</div>; }
export function EmptyState({ children }: { children: string }) { return <div className="state-card empty-state">{children}</div>; }
