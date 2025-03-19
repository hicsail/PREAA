import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AddModel from './AddModel'; 


const App = () => {
  return (
    <Router>
      <Routes> 
        <Route path="/add-model" element={<AddModel />} /> 
      </Routes>
    </Router>
  );
};

export default App;