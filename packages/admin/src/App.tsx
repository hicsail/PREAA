import { Admin } from "react-admin";
import { Layout } from "./Layout";
import { dataProvider } from "./dataProvider";

export const App = () => (
  <Admin layout={Layout} dataProvider={dataProvider}></Admin>
);
