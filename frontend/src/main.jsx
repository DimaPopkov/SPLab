import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { api } from './api/client';
import { Header } from './components/Header';
import HomePage from './components/HomePage';
import { RepoSelector } from './components/RepoSelector';
import { ScanReport } from './components/ScanReport';
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

  useEffect(() => {
    api
      .getMe()
      .then((userData) => {
        setUser(userData);
        return api.getRepos();
      })
      .then((repoList) => {
        setRepos(repoList);
        if (repoList.length > 0) setSelectedRepo(repoList[0].full_name);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setError('');
    try {
      // 1. Запускаем сканирование и получаем начальный пустой отчёт с id
      const initialReport = await api.scanRepo(selectedRepo);
      setReport(initialReport);

      // 2. Каждые 1.5 секунды запрашиваем обновлённый отчёт (по мере обработки батчей по 50 файлов)
      const pollInterval = setInterval(async () => {
        try {
          const updated = await api.getReport(initialReport.id);
          setReport(updated);

          // 3. Останавливаем опрос, когда статус станет completed или failed
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

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      {!user ? (
        <HomePage />
      ) : (
        <div className="container">
          <RepoSelector
            repos={repos}
            selectedRepo={selectedRepo}
            onSelect={setSelectedRepo}
            onScan={handleScan}
            scanning={scanning}
          />
          {error && <div className="error-box">{error}</div>}
          <ScanReport report={report} />
        </div>
      )}
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