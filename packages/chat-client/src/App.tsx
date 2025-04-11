import { useEffect, useState } from 'react';
import ChatWidget from './components/ChatWidget';
import './App.css';
import { setupIframeDetection } from './iframeDetection';

function App() {
  const [modelId, setModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch modelId from URL parameters
  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setIsLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const modelIdParam = urlParams.get('modelId');
        const isEmbed = urlParams.get('embed') === 'true';

        // Set embed mode in a state or context if needed
        if (isEmbed) {
          document.documentElement.classList.add('in-chat-iframe');
          document.body.classList.add('in-chat-iframe');
        }
        if (!modelIdParam) {
          setError('Error: modelId parameter is missing');
          setIsLoading(false);
          return;
        }
        // Validate the modelId by making a request to the backend
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/${modelIdParam}`);
        if (!response.ok) {
          throw new Error(`Failed to validate modelId: ${response.statusText}`);
        }

        const data = await response.json();

        if (data) {
          setModelId(modelIdParam);
        } else {
          setError('Error: Invalid modelId');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error while fetching modelId');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModelData();
    setupIframeDetection();
  }, []);

  // Show loading state
  if (isLoading) {
    return <div className="loading-container"><h1>Loading...</h1></div>;
  }

  // Show error state
  if (error || !modelId) {
    return (
      <div className="error-container">
        <h1>{error || 'Error: modelId parameter is missing'}</h1>
        <p>Please check the URL and try again.</p>
      </div>
    );
  }

  // Render the chat widget with the validated modelId
  return (
    <ChatWidget
      config={{
        title: 'What would you like to know?',
        botName: 'BUzz',
        supportTopics: 'Financial Assistance, Undergraduate Admissions, University Registrar, Student Employment and University Service Center questions', 
        modelId: modelId, // Pass the validated modelId to the chat widget
        theme: {
          primary: '#d32f2f',
          secondary: '#f5f5f5',
          text: '#212121',
          background: '#ffffff'
        }
      }}
    />
  );
}

export default App;