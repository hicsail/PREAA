import { Admin, Resource } from 'react-admin';
import { Layout } from './Layout';
import { dataProvider } from './dataProvider';
import { ModelsList } from './components/models/ModelsList.component';
import { ModelCreate } from './components/models/ModelCreate.component';

export const App = () => (
  <Admin layout={Layout} dataProvider={dataProvider}>
    <Resource name="models" list={ModelsList} create={ModelCreate} />
  </Admin>
);
