import { useState } from "react";
import { motion } from "framer-motion";
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

import { db } from "@/services/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";


import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/services/firebase";

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

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      let userCredential;

      if (isLogin) {
        // 🔐 LOGIN
        userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;

        // 📌 FETCH NAME FROM FIRESTORE AND SAVE LOCALLY
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem("username", userData.name);
        }

        toast.success("Welcome back!");
      } else {
        // 🆕 SIGNUP
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;

        // 💾 SAVE USER NAME IN FIRESTORE
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
        });

        // 📌 Store name in LocalStorage
        localStorage.setItem("username", formData.name);

        toast.success("Account created successfully!");
      }

      // 🔑 Get ID Token (optional for backend verify)
      const token = await userCredential.user.getIdToken();

      await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* LEFT SIDE */}
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
            <span className="text-2xl font-bold">SmartAudit</span>
          </Link>

          <h1 className="text-4xl font-bold mb-6">
            AI-Powered Invoice <br />
            <span className="text-primary">Auditing Platform</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-md">
            Automate invoice processing with advanced AI. Save time and reduce errors.
          </p>
        </div>
      </motion.div>

      {/* RIGHT SIDE */}
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
              <div>
                <Label>Full Name</Label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Email</Label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label>Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="h-12"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12">
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium"
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
