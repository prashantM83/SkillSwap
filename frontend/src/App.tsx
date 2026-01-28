import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Header } from "./components/Header";
import { UserProfile } from "./components/UserProfile";
import { SkillBrowser } from "./components/SkillBrowser";
import { SwapRequests } from "./components/SwapRequests";
import { AdminDashboard } from "./components/AdminDashboard";
import { Login, Register } from "./components/Auth/index.ts";
import { NotFound } from "./components/NotFound";
import type { User } from "./types";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { fetchCurrentUser } from "./features/auth/authSlice";
import { getUserById } from "./services/userService";

// Wrapper component for dynamic user profile routing
const UserProfileWrapper: React.FC<{
  currentUser: User;
}> = ({ currentUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setTargetUser(currentUser);
        setLoading(false);
        return;
      }

      // If it's the current user's profile, use currentUser
      if (userId === currentUser._id) {
        setTargetUser(currentUser);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setTargetUser(userData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 text-gray-500 border-2 border-gray-300 border-t-black rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">Error</div>
              <div className="text-gray-600">{error || "User not found"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = targetUser._id === currentUser._id;
  return <UserProfile user={targetUser} isOwnProfile={isOwnProfile} />;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();

  // Get current user from Redux
  const { user: currentUser, loading: authLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  // Fetch current user on app load if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !currentUser) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, currentUser]);

  // Clear admin redirect flag when user logs out
  useEffect(() => {
    if (!currentUser) {
      // Clear all admin redirect flags when no user is logged in
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('adminRedirected_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [currentUser]);

  // Calculate notifications from Redux swaps state
  const swaps = useSelector((state: RootState) => state.swaps.swaps);
  const notifications = currentUser
    ? swaps.filter((swap) => {
        if (!swap || !swap.toUserId) return false;
        const toUserId =
          typeof swap.toUserId === "string" ? swap.toUserId : swap.toUserId._id;
        return toUserId === currentUser._id && swap.status === "pending";
      }).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentUser={currentUser} notifications={notifications} />

      <main className="py-4 sm:py-8">
        <Routes>
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />

          <Route
            path="/"
            element={
              authLoading ? (
                <div className="flex justify-center items-center h-40 text-lg text-gray-600">
                  Loading...
                </div>
              ) : currentUser ? (
                (() => {
                  // Check if admin has been redirected to dashboard for this session
                  const adminRedirected = localStorage.getItem(`adminRedirected_${currentUser._id}`);
                  
                  if (currentUser.isAdmin && !adminRedirected) {
                    // Mark admin as redirected and redirect to admin dashboard
                    localStorage.setItem(`adminRedirected_${currentUser._id}`, 'true');
                    return <Navigate to="/admin" replace />;
                  }
                  
                  return <SkillBrowser currentUser={currentUser} />;
                })()
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          <Route
            path="/profile"
            element={
              authLoading ? (
                <div className="flex justify-center items-center h-40 text-lg text-gray-600">
                  Loading...
                </div>
              ) : currentUser ? (
                <UserProfile user={currentUser} isOwnProfile={true} />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          <Route
            path="/profile/:userId"
            element={
              authLoading ? (
                <div className="flex justify-center items-center h-40 text-lg text-gray-600">
                  Loading...
                </div>
              ) : currentUser ? (
                <UserProfileWrapper currentUser={currentUser} />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          <Route
            path="/swaps"
            element={
              currentUser ? (
                <SwapRequests currentUser={currentUser} />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              currentUser?.isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
