import React, { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { rtdb } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./Users.css";

const Users = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch Users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = ref(rtdb, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const userList = Object.entries(data).map(([key, value]) => ({
          id: key,
          name: value.name || "N/A",
          email: value.email || "N/A",
          phone: value.phone || "N/A",
        }));
        setUsers(userList);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Convert Data to CSV & Trigger Download
  const downloadCSV = () => {
    const csvContent = [
      ["User ID", "Name", "Email", "Phone"],
      ...users.map((user) => [user.id, user.name, user.email, user.phone]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="users-page-container">
      <h2 className="users-page-title">User Data</h2>

      <table className="users-data-table">
        <thead>
          <tr className="users-table-header">
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="users-table-row">
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.lastVisit}</td>
              </tr>
            ))
          ) : (
            <tr className="users-no-data">
              <td colSpan="5">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="users-button-container">
        <button className="users-download-btn" onClick={downloadCSV}>
          📥 Download CSV
        </button>
        <button className="users-back-btn" onClick={() => navigate("/admin")}>
          ⬅ Back to Admin
        </button>
      </div>
    </div>
  );
};

export default Users;
