import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MappingsPage from './pages/MappingsPage';
import ProxyingPage from './pages/ProxyingPage';
import './App.css';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mappings" element={<MappingsPage />} />
          <Route path="/proxying" element={<ProxyingPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
