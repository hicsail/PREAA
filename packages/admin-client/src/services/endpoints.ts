import { LangFlowMapping } from '../types/langflow-mapping';
<<<<<<< HEAD

=======
import { LiteLLMMapping } from '../types/litellm-mapping';
>>>>>>> f26343756422e509f3c16b3bdbb0825e51f94a81
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
<<<<<<< HEAD
}; 
=======
}; 

export const createNewModelLiteLLM = async (data: LiteLLMMapping) => {
  const formattedData = {
    model_name: data.modelName,
    litellm_params: {
      model:`${data.provider}/${data.modelName}`,
      api_base: data.url,
      api_key: data.apiKey,
      custom_llm_provider: data.provider,
    }
  };
  const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/litellm/`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    throw new Error('Network response error');
  }

  return await response.json();
}
>>>>>>> f26343756422e509f3c16b3bdbb0825e51f94a81
