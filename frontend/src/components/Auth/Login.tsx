import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { RootState, AppDispatch } from "../../store";
import { useNavigate, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles } from "lucide-react";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading, error, token } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasLoggedIn = useRef(false);

  useEffect(() => {
    if (user && token && !hasLoggedIn.current) {
      hasLoggedIn.current = true;
      if (user.isAdmin) {
        toast.success("Login successful! Welcome to Admin Dashboard.");
        navigate("/admin");
      } else {
        toast.success("Login successful!");
        navigate("/");
      }
    }
  }, [user, token, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center space-x-2 mb-2 justify-center">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shadow-sm">
                <LogIn size={24} className="text-white" />
              </div>
              <Sparkles className="text-gray-600" size={32} />
            </div>
            <CardTitle className="text-3xl font-bold text-black mb-2">
              Welcome Back
            </CardTitle>
            <p className="text-gray-600">
              Sign in to continue your skill exchange journey
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="mb-3">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="mb-3">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full flex items-center justify-center space-x-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <NavLink
                  to="/auth/register"
                  className="font-semibold text-black hover:text-gray-700 transition-colors"
                >
                  Create one here
                </NavLink>
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 bg-gray-100 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Demo Credentials</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@skillswap.com / admin123</p>
            <p><strong>User:</strong> user@skillswap.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
};