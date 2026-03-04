import { FC } from 'react';
import { Datagrid, List, TextField } from 'react-admin';

export const ModelsList: FC = () => (
  <List>
    <Datagrid>
      <TextField source="model_name" />
      <TextField source="litellm_params.api_base" label="Base URL" />
      <TextField source="litellm_params.model" label="Langflow ID/Base Model Name" />
    </Datagrid>
  </List>
);
