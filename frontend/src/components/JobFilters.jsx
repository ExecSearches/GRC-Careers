import React from 'react';

export default function JobFilters({ filters, onChange }) {
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    onChange({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  }

  return (
    <div className="filters">
      <input
        type="text"
        name="q"
        placeholder="Search (e.g. GRC analyst, ISO 27001)"
        value={filters.q}
        onChange={handleChange}
      />
      <input
        type="text"
        name="location"
        placeholder="Location (e.g. Dallas, Remote US)"
        value={filters.location}
        onChange={handleChange}
      />
      <select name="seniority" value={filters.seniority} onChange={handleChange}>
        <option value="">All seniority</option>
        <option value="Junior">Junior</option>
        <option value="Mid">Mid</option>
        <option value="Senior">Senior</option>
        <option value="Lead">Lead</option>
      </select>
      <select
        name="employment_type"
        value={filters.employment_type}
        onChange={handleChange}
      >
        <option value="">All types</option>
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Contract">Contract</option>
      </select>
      <label className="checkbox">
        <input
          type="checkbox"
          name="remote"
          checked={filters.remote}
          onChange={handleChange}
        />
        Remote only
      </label>
    </div>
  );
}
