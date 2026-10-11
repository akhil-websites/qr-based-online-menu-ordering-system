import React, { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { useCart } from "./CartContext";
import { rtdb } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  // ✅ Check if user is an admin
  const storedRole = localStorage.getItem("userRole");
  const isAdmin = user && storedRole === "admin";

  // ✅ Fetch menu items from Firebase in real-time
  useEffect(() => {
    const menuRef = ref(rtdb, "menu");
    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsArray = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
        }));
        setMenuItems(itemsArray);
      }
    });
  }, []);

  // ✅ Handle search input
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredItems([]);
    } else {
      const results = menuItems.filter((item) =>
        item.name.toLowerCase().includes(value)
      );
      setFilteredItems(results);
    }
  };

  const handleItemClick = (item) => {
    setSearchTerm(""); // ✅ Clear search box after selection
    setFilteredItems([]); // ✅ Hide search results
  
    // ✅ Ensure item has a category before navigation
    if (item.category) {
      navigate(`/item/${item.id}`); // Navigate to item details page
    } else {
      navigate(`/`); // Default fallback to home
    }
  };
  
  return (
    <>
      {/* Top Navbar */}
      <div className="navbar-top">
        <div className="logo">🍽 ONLINE RESTAURANT</div>

        {/* ✅ Real-Time Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search dishes..."
            className="search-bar"
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* ✅ Search Results Dropdown */}
          {searchTerm && (
            <div className="search-results">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="search-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <img src={item.image} alt={item.name} />
                    <span>{item.name} - ₹{item.price}</span>
                  </div>
                ))
              ) : (
                <p className="no-results">❌ No results found.</p>
              )}
            </div>
          )}
        </div>

        <div className="cart-login">
          {/* ✅ Profile Section */}
          {user ? (
            <div className="profile-dropdown">
              <NavLink to="/profile" className="profile-btn">
                👤 {user.displayName || "Profile"}
              </NavLink>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/auth" className="login-btn">
              Login / Signup
            </NavLink>
          )}

          {/* ✅ Cart Button */}
          <NavLink to="/cart" className="cart-btn">
            🛒 Cart <span>({getCartCount()})</span>
          </NavLink>
        </div>
      </div>

      {/* Bottom Navbar - Category Navigation */}
      <div className="navbar-bottom">
        <NavLink to="/" className={({ isActive }) => (isActive ? "category active" : "category")}>Home</NavLink>
        <NavLink to="/veg" className={({ isActive }) => (isActive ? "category active" : "category")}>Veg</NavLink>
        <NavLink to="/nonveg" className={({ isActive }) => (isActive ? "category active" : "category")}>Non-Veg</NavLink>
        <NavLink to="/desserts" className={({ isActive }) => (isActive ? "category active" : "category")}>Desserts</NavLink>
        <NavLink to="/icecream" className={({ isActive }) => (isActive ? "category active" : "category")}>Ice Cream</NavLink>
        <NavLink to="/drinks" className={({ isActive }) => (isActive ? "category active" : "category")}>Cool Drinks</NavLink>
        <NavLink to="/starters" className={({ isActive }) => (isActive ? "category active" : "category")}>Starters</NavLink>
        <NavLink to="/menu" className={({ isActive }) => (isActive ? "category active" : "category")}>Menu</NavLink>
        <NavLink to="/order" className="track-btn">📍 Track Your Order</NavLink>

        {/* ✅ Show Admin Panel Only for Admins */}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "category active admin-link" : "category admin-link")}>
            🔧 Admin Panel
          </NavLink>
        )}
      </div>
    </>
  );
};

export default Navbar;
