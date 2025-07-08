import { FC } from 'react';
import { Create, SimpleForm, TextInput } from 'react-admin';

export const ProxyCreate: FC = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source='modelName' />
        <TextInput source='url' />
        <TextInput source='apiKey' />
      </SimpleForm>
    </Create>
  )
};
