import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AvatarCatalogProvider } from "./contexts/AvatarCatalogContext";
import { ToastContainer } from "./components/common/ToastContainer";
import { HomePage } from "./pages/Home/HomePage";
import { CreateRoomPage } from "./pages/CreateRoom/CreateRoomPage";
import { JoinRoomPage } from "./pages/JoinRoom/JoinRoomPage";
import { LobbyPage } from "./pages/Lobby/LobbyPage";
import { SecretWordPage } from "./pages/SecretWord/SecretWordPage";
import { GameStartedPage } from "./pages/GameStarted/GameStartedPage";
import { NextRoundPage } from "./pages/NextRound/NextRoundPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { AdminLoginPage } from "./pages/Admin/AdminLoginPage";
import { AdminWordBankPage } from "./pages/Admin/AdminWordBankPage";
import { AdminAssetManagerPage } from "./pages/Admin/AdminAssetManagerPage";

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/create" element={<CreateRoomPage />} />
    <Route path="/join" element={<JoinRoomPage />} />
    <Route path="/room/:roomId/lobby" element={<LobbyPage />} />
    <Route path="/room/:roomId/secret" element={<SecretWordPage />} />
    <Route path="/room/:roomId/play" element={<GameStartedPage />} />
    <Route path="/room/:roomId/next" element={<NextRoundPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminWordBankPage />} />
    <Route path="/admin/assets" element={<AdminAssetManagerPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AvatarCatalogProvider>
          <HashRouter>
            <ToastContainer />
            <AppRoutes />
          </HashRouter>
        </AvatarCatalogProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
};

export default App;
