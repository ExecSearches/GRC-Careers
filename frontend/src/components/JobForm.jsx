import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../api.js';

export default function JobForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    employment_type: 'Full-time',
    seniority: 'Mid',
    salary_min: '',
    salary_max: '',
    remote: true,
    description: '',
    requirements: '',
    tags: 'GRC, ISO 27001, SOC 2'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []
      };
      const created = await createJob(payload);
      navigate(`/jobs/${created.id}`);
    } catch (e) {
      setError(e.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="job-form">
      <h1>Post a GRC role</h1>
      <p className="subtitle">
        Use this form to add Governance, Risk & Compliance positions to GRC-Jobs-Board.com.
      </p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Job title
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Senior GRC Analyst"
            required
          />
        </label>

        <label>
          Company
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="e.g. FintechCo"
            required
          />
        </label>

        <label>
          Location
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Dallas, TX (Hybrid)"
            required
          />
        </label>

        <div className="row">
          <label>
            Employment type
            <select
              name="employment_type"
              value={form.employment_type}
              onChange={handleChange}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
          </label>

          <label>
            Seniority
            <select name="seniority" value={form.seniority} onChange={handleChange}>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </label>
        </div>

        <div className="row">
          <label>
            Salary min (USD)
            <input
              type="number"
              name="salary_min"
              value={form.salary_min}
              onChange={handleChange}
              min="0"
            />
          </label>
          <label>
            Salary max (USD)
            <input
              type="number"
              name="salary_max"
              value={form.salary_max}
              onChange={handleChange}
              min="0"
            />
          </label>
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            name="remote"
            checked={form.remote}
            onChange={handleChange}
          />
          Remote-friendly
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="High-level description, responsibilities, tools (e.g. Archer, ServiceNow GRC, OneTrust), frameworks (SOC 2, ISO 27001, NIST, PCI-DSS) etc."
            rows={6}
            required
          />
        </label>

        <label>
          Requirements
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            placeholder="Years of experience, certifications (CISA, CISSP, CRISC), skills, must-have frameworks."
            rows={5}
          />
        </label>

        <label>
          Tags (comma separated)
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Posting...' : 'Post job'}
        </button>
      </form>
    </div>
  );
}
