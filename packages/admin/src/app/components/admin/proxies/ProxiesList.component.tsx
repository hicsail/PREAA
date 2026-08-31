import { FC } from 'react';
import { BooleanField, Datagrid, List, TextField } from 'react-admin';

export const ProxiesList: FC = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="modelName" />
      <TextField source="id" />
      <BooleanField source="suggestionsEnabled" label="Follow-up suggestions" />
    </Datagrid>
  </List>
);
