import { FC } from 'react';
import { BooleanInput, Edit, SimpleForm, TextField } from 'react-admin';

export const ProxyEdit: FC = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextField source="modelName" />
      <BooleanInput
        source="suggestionsEnabled"
        label="Follow-up suggestions"
        helperText="Show clickable follow-up questions after each answer in the embedded chat widget"
      />
    </SimpleForm>
  </Edit>
);
