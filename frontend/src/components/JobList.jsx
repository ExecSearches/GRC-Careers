import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobs } from '../api.js';
import JobFilters from './JobFilters.jsx';

export default function JobList() {
  const [filters, setFilters] = useState({
    q: '',
    location: '',
    seniority: '',
    employment_type: '',
    remote: false
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const params = { ...filters };
        if (!filters.remote) delete params.remote;
        else params.remote = 'true';
        const data = await fetchJobs(params);
        if (!cancelled) setJobs(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div>
      <h1>GRC Jobs</h1>
      <p className="subtitle">
        Roles in governance, risk and compliance: ISO 27001, SOC 2, PCI-DSS, SOX, privacy and more.
      </p>

      <JobFilters filters={filters} onChange={setFilters} />

      {loading && <p>Loading jobs...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

      <ul className="job-list">
        {jobs.map((job) => (
          <li key={job.id} className="job-card">
            <Link to={`/jobs/${job.id}`}>
              <div className="job-main">
                <h2>{job.title}</h2>
                <p className="company">{job.company}</p>
              </div>
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
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
