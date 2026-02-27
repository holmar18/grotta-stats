import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PinScreen from './components/PinScreen';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import PlayersPage from './pages/PlayersPage';
import StatsPage from './pages/StatsPage';
import ComparePage from './pages/ComparePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout gameActive={gameActive} />}>
          <Route index element={<HomePage onGameActiveChange={setGameActive} />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}