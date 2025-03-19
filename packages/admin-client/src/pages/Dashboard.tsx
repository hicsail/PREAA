import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import MappingsPage from '../components/mappings/MappingsPage';
import ProxyingPage from '../components/proxying/ProxyingPage';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState<string>('mappings');

  useEffect(() => {
    const handlePageChange = (event: CustomEvent<{ page: string }>) => {
      setCurrentPage(event.detail.page);
    };

    window.addEventListener('page-change', handlePageChange as EventListener);
    
    return () => {
      window.removeEventListener('page-change', handlePageChange as EventListener);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'mappings':
        return <MappingsPage />;
      case 'proxying':
        return <ProxyingPage />;
      default:
        return <MappingsPage />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
};

export default Dashboard; 