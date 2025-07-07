import { FC } from 'react';
import { Create, SimpleForm, TextInput } from 'react-admin';

export const ModelCreate: FC = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source='model_name' />
        <TextInput source='litellm_params.model' />
      </SimpleForm>
    </Create>
  );
};
