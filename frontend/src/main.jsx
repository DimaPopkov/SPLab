import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { api } from './api/client';
import { Header } from './components/Header';
import HomePage from './components/HomePage';
import { RepoSelector } from './components/RepoSelector';
import { ScanReport } from './components/ScanReport';
import { ProfilePage } from './components/ProfilePage';
import './styles/index.css';
import './styles/header.css';

function Root() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const repoFromQuery = searchParams.get('repo');

  useEffect(() => {
    api
      .getMe()
      .then((userData) => {
        setUser(userData);
        return api.getRepos();
      })
      .then((repoList) => {
        setRepos(repoList);
        if (repoFromQuery && repoList.some((r) => r.full_name === repoFromQuery)) {
          setSelectedRepo(repoFromQuery);
        } else if (repoList.length > 0 && !selectedRepo) {
          setSelectedRepo(repoList[0].full_name);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [repoFromQuery]);

  const handleScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setError('');
    try {
      const initialReport = await api.scanRepo(selectedRepo);
      setReport(initialReport);

      const pollInterval = setInterval(async () => {
        try {
          const updated = await api.getReport(initialReport.id);
          setReport(updated);

          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(pollInterval);
            setScanning(false);
          }
        } catch {
          clearInterval(pollInterval);
          setScanning(false);
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
      setScanning(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setRepos([]);
    setReport(null);
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-box">
          <span className="loader-spinner" />
          <div className="loader-text">
            <strong>SPLAB // INIT</strong>
            <span>Проверка сессии и подключение...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <HomePage />
            ) : (
              <div className="container scanner-workspace">
                <RepoSelector
                  repos={repos}
                  selectedRepo={selectedRepo}
                  onSelect={setSelectedRepo}
                  onScan={handleScan}
                  scanning={scanning}
                />
                {error && <div className="alert-error">{error}</div>}
                <ScanReport report={report} />
              </div>
            )
          }
        />

        <Route path="/profile" element={<ProfilePage user={user} />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>
);