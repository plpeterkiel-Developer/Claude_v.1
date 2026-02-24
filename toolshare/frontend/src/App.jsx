import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ToolDetail from './pages/ToolDetail';
import AddTool from './pages/AddTool';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LeaveReview from './pages/LeaveReview';
import AccountSettings from './pages/AccountSettings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/tools/:id" element={<ToolDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected routes — require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tools/new" element={<AddTool />} />
            <Route path="/tools/:id/edit" element={<AddTool editMode />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/requests/:id" element={<Dashboard />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/reviews/new/:requestId" element={<LeaveReview />} />
            <Route path="/account" element={<AccountSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
