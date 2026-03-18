import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJob } from '../api.js';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchJob(id);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p>Loading job...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!job) return <p>Job not found.</p>;

  return (
    <article className="job-detail">
      <Link to="..">← Back to jobs</Link>
      <h1>{job.title}</h1>
      <p className="company">{job.company}</p>
      <p className="meta">
        {job.location} • {job.employment_type} • {job.seniority}
        {job.remote ? ' • Remote-friendly' : ''}
      </p>
      {job.salary_min && (
        <p className="salary">
          ${job.salary_min.toLocaleString()} - $
          {job.salary_max?.toLocaleString() || '—'} base
        </p>
      )}
      {job.tags && (
        <p className="tags">
          {job.tags.split(',').map((t) => (
            <span key={t} className="tag">{t.trim()}</span>
          ))}
        </p>
      )}
      <section>
        <h2>Description</h2>
        <pre className="multiline">{job.description}</pre>
      </section>
      {job.requirements && job.requirements.trim() !== '' && (
        <section>
          <h2>Requirements</h2>
          <pre className="multiline">{job.requirements}</pre>
        </section>
      )}
      <section>
        <h2>How to apply</h2>
        <p>
          Include the job title "{job.title}" in your subject line.
        </p>
      </section>
    </article>
  );
}
