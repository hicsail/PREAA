import { useEffect, useState } from 'react'
import { DeepChat } from "deep-chat-react";
import './App.css'

function App() {

  const [modelId, setModelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // fetch modelId parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('modelId');
    if (modelId) {
      fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/${modelId}`)
        .then(response => response.json())
        .then(data => {
          if (data) {
            setModelId(modelId);
          }
        })
        .catch(_error => {
          setErrorMessage('Error while fetching modelId');
        });
    }
  }, [modelId]);

  // return error message if modelId is not provided
  if (!modelId) {
    return (
      <div>
        <h1>Error: modelId parameter is missing</h1>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    )
  }

  return (
    <>
      <DeepChat
        requestBodyLimits={{ maxMessages: -1 }}
        connect={{
          url: `${import.meta.env.VITE_BACKEND_BASE_URL}/deepchat-proxy/proxy/${modelId}`,
        }} />
    </>
  )
}

export default App;