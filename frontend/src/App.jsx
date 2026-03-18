import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import JobList from './components/JobList.jsx';
import JobDetail from './components/JobDetail.jsx';
import JobForm from './components/JobForm.jsx';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/admin/new-job" element={<JobForm />} />
        </Routes>
      </main>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-main">GRC</span>
          <span className="logo-sub">Jobs Board</span>
        </div>
        <nav>
          <Link to="/">Jobs</Link>
          <Link to="/admin/new-job">Post a job</Link>
        </nav>
      </div>
    </header>
  );
}
