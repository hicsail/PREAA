'use client'; // remove this line if you choose Pages Router
import { Admin, Resource, ListGuesser, EditGuesser } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { FC } from 'react';

const dataProvider = jsonServerProvider('https://jsonplaceholder.typicode.com');

const AdminApp: FC = () => (
  <Admin dataProvider={dataProvider}>
    <Resource
      name='users'
      list={ListGuesser}
      edit={EditGuesser}
      recordRepresentation='name'
    />
    <Resource
      name='posts'
      list={ListGuesser}
      edit={EditGuesser}
      recordRepresentation='title'
    />
    <Resource name='comments' list={ListGuesser} edit={EditGuesser} />
  </Admin>
);

export default AdminApp;
