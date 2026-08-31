import { FC } from 'react';
import { BooleanInput, Create, SimpleForm, TextInput } from 'react-admin';

export const ProxyCreate: FC = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="modelName" />
        <TextInput source="apiKey" />
        <BooleanInput
          source="suggestionsEnabled"
          label="Follow-up suggestions"
          defaultValue={false}
          helperText="Show clickable follow-up questions after each answer in the embedded chat widget"
        />
      </SimpleForm>
    </Create>
  );
};
