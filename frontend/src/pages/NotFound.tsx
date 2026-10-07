import { Link } from 'react-router-dom';
export function NotFound() { return <main className="not-found"><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>This page is off the schedule.</h1><p>The address may have changed or the page may no longer exist.</p><Link className="button button-primary" to="/">Return home</Link></main>; }
