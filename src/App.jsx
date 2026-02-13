import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PinScreen from './components/PinScreen';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import PlayersPage from './pages/PlayersPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import ComparePage from './pages/ComparePage';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
