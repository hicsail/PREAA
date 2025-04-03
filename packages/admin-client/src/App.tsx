import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MappingsPage from './pages/MappingsPage';
import ProxyingPage from './pages/ProxyingPage';
import './App.css';
import { ClientProvider } from './contexts/Client.context';

function App() {
  return (
    <ClientProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/mappings" element={<MappingsPage />} />
            <Route path="/proxying" element={<ProxyingPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ClientProvider>
  );
}

export default App;
