import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { db } from "./firebaseConfig";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "./Profile.css";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);

      // ✅ Listen for real-time updates
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No user data found.");
        }
      });

      return () => unsubscribe(); // ✅ Cleanup listener on unmount
    }
  }, [user]);

  // ✅ Handle Phone Number Update
  const handlePhoneUpdate = async () => {
    if (!newPhone || newPhone.length !== 10) {
      alert("❌ Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { phone: newPhone });

      alert("✅ Phone number updated successfully!");
      setEditingPhone(false);
    } catch (error) {
      console.error("Error updating phone number:", error);
    }
  };

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {userData ? (
        <>
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Role:</strong> {userData.role}</p>

          {/* ✅ Editable Phone Number */}
          <p><strong>Phone:</strong> 
            {editingPhone ? (
              <>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter new phone number"
                />
                <button onClick={handlePhoneUpdate}>Save</button>
                <button onClick={() => setEditingPhone(false)}>Cancel</button>
              </>
            ) : (
              <>
                {userData.phone || "Not Available"}
                <button onClick={() => setEditingPhone(true)}>Edit</button>
              </>
            )}
          </p>
        </>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default Profile;
