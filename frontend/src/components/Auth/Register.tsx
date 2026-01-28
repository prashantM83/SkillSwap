import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authSlice";
import { RootState, AppDispatch } from "../../store";
import { useNavigate, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Sparkles } from "lucide-react";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const Register = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading, error, token } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (user && token && !hasRegistered.current) {
      toast.success("Registration successful! Welcome to SkillSwap!");
      hasRegistered.current = true;
      navigate("/");
    }
  }, [user, token, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    dispatch(registerUser({ name, email, password }));
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center space-x-2 mb-2 justify-center">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shadow-sm">
                <UserPlus size={24} className="text-white" />
              </div>
              <Sparkles className="text-gray-600" size={32} />
            </div>
            <CardTitle className="text-3xl font-bold text-black mb-2">
              Join SkillSwap
            </CardTitle>
            <p className="text-gray-600">
              Create your account and start exchanging skills today
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="mb-3">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
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
                    placeholder="Create a password"
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
              <div>
                <Label htmlFor="confirmPassword" className="mb-3">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 pr-12"
                    placeholder="Confirm your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>At least 6 characters long</span>
                  </li>
                  <li className={`flex items-center space-x-2 ${password && confirmPassword && password === confirmPassword ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${password && confirmPassword && password === confirmPassword ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Passwords match</span>
                  </li>
                </ul>
              </div>
              {(error || passwordError) && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{passwordError || error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full flex items-center justify-center space-x-2" disabled={loading || !!passwordError}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing up...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Sign Up</span>
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <NavLink
                  to="/auth/login"
                  className="font-semibold text-black hover:text-gray-700 transition-colors"
                >
                  Sign in here
                </NavLink>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};