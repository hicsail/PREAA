import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MappingsPage from './pages/MappingsPage';
import ProxyingPage from './pages/ProxyingPage';
import './App.css';
import { ClientProvider } from './contexts/Client.context';
import { SnackbarProvider } from './contexts/Snackbar.context';

function App() {
  return (
    <ClientProvider>
      <SnackbarProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/mappings" element={<MappingsPage />} />
              <Route path="/proxying" element={<ProxyingPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </SnackbarProvider>
    </ClientProvider>
  );
}

export default App;
