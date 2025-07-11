'use client';
import { Admin, Resource } from 'react-admin';
import { FC } from 'react';
import { ModelsList } from './admin/models/ModelsList.component';
import { ModelCreate } from './admin/models/ModelCreate.component';
import simpleRestProvider from 'ra-data-simple-rest';
import { ProxyCreate } from './admin/proxies/ProxyCreate.component';
import { ProxiesList } from './admin/proxies/ProxiesList.component';

const dataProvider = simpleRestProvider('/api');

const AdminApp: FC = () => (
  <Admin dataProvider={dataProvider}>
    <Resource name="models" list={ModelsList} create={ModelCreate} />
    <Resource name="proxies" list={ProxiesList} create={ProxyCreate} />
  </Admin>
);

export default AdminApp;
