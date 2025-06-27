import { Admin, ListGuesser, Resource } from "react-admin";
import { Layout } from "./Layout";
import { dataProvider } from "./dataProvider";

export const App = () => (
  <Admin layout={Layout} dataProvider={dataProvider}>
    <Resource name="models" list={ListGuesser} />
  </Admin>
);
