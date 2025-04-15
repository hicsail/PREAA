import { createContext, FC, ReactNode, useContext } from 'react';
import { client } from '../client/client.gen';

const ClientContext = createContext({} as typeof client);

export interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: FC<ClientProviderProps> = ({ children }) => {
  client.setConfig({
    baseUrl: import.meta.env.VITE_BACKEND_BASE_URL
  });

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
};

export const useClient = () => useContext(ClientContext);
