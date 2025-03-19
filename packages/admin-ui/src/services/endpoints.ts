import { LangFlowMapping } from '../types/langflow-mapping';

export const createLangFlowMapping = async (data: LangFlowMapping) => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/mapping/`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Network response error');
  }

  return await response.json();
};