import { useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api.ts";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { db, auth } from "@/services/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.email || !formData.password) return;

  try {
    setLoading(true);

    // 1. PRIMARY AUTH (Critical Path)
    const userCredential = isLogin 
      ? await signInWithEmailAndPassword(auth, formData.email, formData.password)
      : await createUserWithEmailAndPassword(auth, formData.email, formData.password);

    const firebaseUser = userCredential.user;
    
    // 2. PARALLEL OPERATIONS
    // Start getting the token and the Firestore data at the same time
    const tokenPromise = firebaseUser.getIdToken();
    
    let displayName = formData.name; // Default for Signup

    if (isLogin) {
      // Fetch name only if logging in
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      displayName = userDoc.exists() ? userDoc.data().name : "User";
    } else {
      // Signup: Save to Firestore but DON'T 'await' it if you want max speed
      // The user is already created in Auth, Firestore can happen in the background
      setDoc(doc(db, "users", firebaseUser.uid), {
        name: formData.name,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });
    }

    const token = await tokenPromise;

    // 3. OPTIMISTIC UI STORAGE
    const userPayload = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName,
    };
    localStorage.setItem("user", JSON.stringify(userPayload));
    localStorage.setItem("username", displayName);

    // 4. BACKGROUND VERIFICATION (Don't 'await' this!)
    // This allows the user to navigate while the backend wakes up
    api.post("/api/auth/verify", {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error("Background Verify Failed:", err));

    // 5. IMMEDIATE NAVIGATION
    toast.success(isLogin ? "Welcome back!" : "Account created!");
    navigate("/dashboard");

  } catch (error: any) {
    console.error("Auth error:", error);
    toast.error(error.message || "Authentication failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex">
      {/* LEFT SIDE: Visuals */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted dark:bg-[#090E1A]"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-2xl font-bold">S</span>
            </div>
            <span className="text-2xl font-bold">Shard</span>
          </Link>

          <h1 className="text-4xl font-bold mb-6">
            AI-Powered <br />
            <span className="text-primary">Invoice Automation</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-md">
            Automate invoice processing with advanced AI. Save time, reduce errors, and scale your business.
          </p>
        </div>
      </motion.div>

      {/* RIGHT SIDE: Form */}
      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? "Enter your credentials to access your account"
              : "Fill in your details to get started"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 text-base">
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                  />
                  Please wait...
                </span>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: "", email: "", password: "", confirmPassword: "" });
              }}
              className="text-primary font-medium hover:underline transition-all"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;