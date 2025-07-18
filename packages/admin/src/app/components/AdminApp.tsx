'use client';

import { Admin, Resource } from 'react-admin';
import { FC, useEffect, useState } from 'react';
import { ModelsList } from './admin/models/ModelsList.component';
import { ModelCreate } from './admin/models/ModelCreate.component';
import simpleRestProvider from 'ra-data-simple-rest';
import { ProxyCreate } from './admin/proxies/ProxyCreate.component';
import { ProxiesList } from './admin/proxies/ProxiesList.component';
import { getAuth } from './admin/auth';
import { SessionProvider, useSession } from 'next-auth/react';
import { AuthProvider } from 'react-admin';

const dataProvider = simpleRestProvider('/api');

const AdminApp: FC = () => (
  <SessionProvider>
    <InnerWrapper />
  </SessionProvider>
);

const InnerWrapper: FC = () => {
  const session = useSession();
  const [authProvider, setAuthProvider] = useState<AuthProvider | null>(null);

  useEffect(() => {
    if (session.status === 'loading') {
      return;
    }
    setAuthProvider(getAuth(session));
  }, [session]);

  return (
    <>
      {authProvider &&
        <Admin dataProvider={dataProvider} authProvider={authProvider}>
          <Resource name="models" list={ModelsList} create={ModelCreate} />
          <Resource name="proxies" list={ProxiesList} create={ProxyCreate} />
        </Admin>
      }
    </>
  );
};

export default AdminApp;
