import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Accueil from './pages/Accueil';
import Cave from './pages/Cave';
import FicheVin from './pages/FicheVin';
import FormulaireVin from './pages/FormulaireVin';
import Inventaire from './pages/Inventaire';
import Reglages from './pages/Reglages';

// HashRouter : pas de configuration serveur nécessaire pour l'hébergement statique
// (GitHub Pages) ni pour le mode hors-ligne — les liens profonds fonctionnent toujours.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Accueil />} />
          <Route path="/cave" element={<Cave />} />
          <Route path="/inventaire" element={<Inventaire />} />
          <Route path="/reglages" element={<Reglages />} />
          <Route path="/vin/nouveau" element={<FormulaireVin />} />
          <Route path="/vin/:id" element={<FicheVin />} />
          <Route path="/vin/:id/edit" element={<FormulaireVin />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
