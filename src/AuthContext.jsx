import React, { createContext, useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut, rtdb } from "./firebaseConfig";
import { ref, get, set } from "firebase/database";

// ✅ Create & Export Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        console.log("User logged in:", currentUser);

        const userRef = ref(rtdb, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);

        let assignedRole = "user"; // Default role is "user"
        if (snapshot.exists()) {
          assignedRole = snapshot.val().role;
        } else {
          await set(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName,
            email: currentUser.email,
            role: assignedRole,
          });
        }

        // ✅ Check Firebase Admin Claims (If Admin, assign role)
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            assignedRole = "admin";
          }
        } catch (error) {
          console.error("Error checking admin claims:", error);
        }

        setUser(currentUser);
        setRole(assignedRole);
        localStorage.setItem("userRole", assignedRole); // ✅ Store role in local storage
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(rtdb, `users/${user.uid}`);
      const snapshot = await get(userRef);

      let assignedRole = "user";
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: assignedRole,
        });
      } else {
        assignedRole = snapshot.val().role;
      }

      // ✅ Check Firebase Admin Claims
      try {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin) {
          assignedRole = "admin";
        }
      } catch (error) {
        console.error("Error checking admin claims:", error);
      }

      setUser(user);
      setRole(assignedRole);
      localStorage.setItem("userRole", assignedRole); // ✅ Store in localStorage

      alert("✅ Login Successful!");
      window.location.reload(); // ✅ Reload page after login
    } catch (error) {
      console.error("❌ Google Login Failed:", error.message);
      alert("❌ Login Failed! Please try again.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    localStorage.removeItem("userRole"); // ✅ Remove role from storage
    alert("✅ Logged Out!");
    window.location.reload(); // ✅ Reload page after logout
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
