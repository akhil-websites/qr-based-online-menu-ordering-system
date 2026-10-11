import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { auth, rtdb } from "./firebaseConfig";
import { signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import "./Auth.css";

const ADMIN_UID = "AAGzBobZ8dYgtwBalZGzU2V18uC3";

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, setRole } = useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "user") navigate("/", { replace: true });
  }, [role, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;
    if (!name || !email || !phone || !password || !confirmPassword) return setError("❌ All fields are required!");
    if (!/^\d{10}$/.test(phone)) return setError("❌ Invalid phone number! Must be 10 digits.");
    if (password !== confirmPassword) return setError("❌ Passwords do not match!");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await set(ref(rtdb, `users/${user.uid}`), { uid: user.uid, name, email, phone, role: "user" });
      setRole("user");
      localStorage.setItem("userRole", "user");
      alert("✅ Signup Successful!");
      navigate("/", { replace: true });
    } catch (error) {
      setError("❌ Signup Failed! " + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) return setError("❌ Email and Password are required!");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const snapshot = await get(ref(rtdb, `users/${user.uid}`));
      const assignedRole = snapshot.exists() ? snapshot.val().role : "user";
      setRole(assignedRole);
      localStorage.setItem("userRole", assignedRole);
      alert("✅ Login Successful!");
      navigate(assignedRole === "admin" ? "/admin" : "/", { replace: true });
    } catch (error) {
      setError("❌ Login Failed! " + error.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      const userRef = ref(rtdb, `users/${user.uid}`);
      const snapshot = await get(userRef);
      let assignedRole = snapshot.exists() ? snapshot.val().role : "user";
      if (!snapshot.exists()) {
        assignedRole = user.uid === ADMIN_UID ? "admin" : "user";
        await set(userRef, { uid: user.uid, name: user.displayName, email: user.email, phone: "", role: assignedRole });
      }
      setRole(assignedRole);
      localStorage.setItem("userRole", assignedRole);
      alert("✅ Login Successful!");
      navigate(assignedRole === "admin" ? "/admin" : "/", { replace: true });
    } catch (error) {
      setError("❌ Google Sign-In Failed! " + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRole(null);
    localStorage.removeItem("userRole");
    alert("✅ Logged Out!");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="auth-container">
      {user ? (
        <>
          <h2>✅ Logged in as {user.displayName}</h2>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <h2>{isSignup ? "Signup" : "Login"}</h2>
          <form onSubmit={isSignup ? handleSignup : handleLogin}>
            {isSignup && <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />}
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            {isSignup && <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />}
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            {isSignup && <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />}
            {error && <p className="error-msg">{error}</p>}
            <button type="submit">{isSignup ? "Signup" : "Login"}</button>
          </form>
          <p onClick={() => setIsSignup(!isSignup)} className="toggle-link">
            {isSignup ? "Already have an account? Login" : "Don't have an account? Signup"}
          </p>
          <button className="google-btn" onClick={loginWithGoogle}>Sign in with Google</button>
        </>
      )}
    </div>
  );
};

export default Auth;
