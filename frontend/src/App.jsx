import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import UserManagement from "./pages/UserManagement";
import { ROLES } from "./utils/roles";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<PlaceholderPage pageKey="vehicles" title="Vehicle Registry" />} />
          <Route path="/drivers" element={<PlaceholderPage pageKey="drivers" title="Driver Profiles" />} />
          <Route path="/trips" element={<PlaceholderPage pageKey="trips" title="Trip Dispatcher" />} />
          <Route path="/maintenance" element={<PlaceholderPage pageKey="maintenance" title="Maintenance Logs" />} />
          <Route path="/fuel-expenses" element={<PlaceholderPage pageKey="fuelExpenses" title="Fuel Expenses" />} />
          <Route path="/analytics" element={<PlaceholderPage pageKey="analytics" title="Analytics" />} />
          <Route
            path="/users"
            element={(
              <RoleRoute roles={[ROLES.FLEET_MANAGER]}>
                <UserManagement />
              </RoleRoute>
            )}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
