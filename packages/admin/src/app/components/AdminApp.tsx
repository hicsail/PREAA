'use client';
import { Admin, Resource } from 'react-admin';
import { FC } from 'react';
import { ModelsList } from './admin/models/ModelsList.component';
import { ModelCreate } from './admin/models/ModelCreate.component';
import simpleRestProvider from 'ra-data-simple-rest';

const dataProvider = simpleRestProvider('/api');

const AdminApp: FC = () => (
  <Admin dataProvider={dataProvider}>
    <Resource name='models' list={ModelsList} create={ModelCreate} />
  </Admin>
);

export default AdminApp;
