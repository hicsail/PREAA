import { FC } from 'react';
import { Datagrid, List, TextField } from 'react-admin';

export const ProxiesList: FC = () => (
  <List>
    <Datagrid>
      <TextField source="modelName" />
      <TextField source="url" />
    </Datagrid>
  </List>
);
