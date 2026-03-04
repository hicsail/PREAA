import { FC } from 'react';
import { Create, required, SelectInput, SimpleForm, TextInput } from 'react-admin';

export const ModelCreate: FC = () => {
  const providers = [{ id: 'langflow', name: 'Langflow' }];

  return (
    <Create>
      <SimpleForm>
        <TextInput source="model_name" label="Human Readable Name" validate={[required()]} />
        <TextInput source="litellm_params.model" validate={[required()]} label="Langflow ID" />
        <TextInput
          source="litellm_params.api_base"
          validate={[required()]}
          label="Base URL of LangFlow (no training slash)"
        />
        <TextInput source="litellm_params.api_key" validate={[required()]} label="API Key for Langflow" />
        <SelectInput
          source="litellm_params.custom_llm_provider"
          validate={[required()]}
          choices={providers}
          label="LiteLLM Provider"
        />
      </SimpleForm>
    </Create>
  );
};
