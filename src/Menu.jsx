import React, { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { ref, onValue } from "firebase/database";
import { rtdb } from "./firebaseConfig";
import "./Menu.css";

const Menu = () => {
  const { addToCart } = useCart();
  const [menu, setMenu] = useState({});
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const menuRef = ref(rtdb, "menu");
    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedMenu = {};
        Object.values(data).forEach((item) => {
          if (!formattedMenu[item.category]) {
            formattedMenu[item.category] = {};
          }
          const subcategoryKey = `Sub Category-${item.subcategory}`;
          if (!formattedMenu[item.category][subcategoryKey]) {
            formattedMenu[item.category][subcategoryKey] = [];
          }
          formattedMenu[item.category][subcategoryKey].push({
            ...item,
            quantity: 1, // Default quantity
          });
        });
        setMenu(formattedMenu);
      }
    });
  }, []);

  const handleQuantityChange = (category, subcategory, itemId, type) => {
    setMenu((prevMenu) => {
      if (!prevMenu[category] || !prevMenu[category][subcategory]) return prevMenu;
      const updatedMenu = { ...prevMenu };
      updatedMenu[category] = {
        ...updatedMenu[category],
        [subcategory]: updatedMenu[category][subcategory].map((item) =>
          item.id === itemId
            ? { ...item, quantity: type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1) }
            : item
        ),
      };
      return updatedMenu;
    });
  };

  const handleAddToCart = (category, subcategory, itemId) => {
    const itemToAdd = menu[category][subcategory].find((item) => item.id === itemId);
    if (!itemToAdd) return;

    addToCart({
      id: itemToAdd.id,
      name: itemToAdd.name,
      price: itemToAdd.price,
      quantity: itemToAdd.quantity,
      totalPrice: (itemToAdd.price * itemToAdd.quantity).toFixed(2),
      image: itemToAdd.image,
    });

    setAddedItems((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 5000);
  };

  return (
    <div className="menu-page-container">
      <h1 className="menu-title">Our Menu</h1>
      {Object.keys(menu).length > 0 ? (
        Object.keys(menu).map((category) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            {Object.keys(menu[category])
              .sort((a, b) => {
                // Extract numbers and sort numerically
                const numA = parseInt(a.split("-")[1], 10);
                const numB = parseInt(b.split("-")[1], 10);
                return numA - numB;
              })
              .map((subcategory) => (
                <div key={subcategory} className="subcategory-section">
                  <h3 className="subcategory-title">{subcategory}</h3>
                  <table className="menu-table">
                    <thead>
                      <tr className="menu-table-header">
                        <th className="menu-table-th">Image</th>
                        <th className="menu-table-th">Item Name</th>
                        <th className="menu-table-th">Price</th>
                        <th className="menu-table-th">Quantity</th>
                        <th className="menu-table-th">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menu[category][subcategory].map((item) => (
                        <tr key={item.id} className="menu-table-row">
                          <td className="menu-table-td">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="menu-item-image"
                              />
                            ) : (
                              "No Image"
                            )}
                          </td>
                          <td className="menu-table-td">{item.name}</td>
                          <td className="menu-table-td">
                            {item.half && item.full ? (
                              <>
                                <p>Half: ₹{item.half}</p>
                                <p>Full: ₹{item.full}</p>
                              </>
                            ) : (
                              <p>₹{item.price || "N/A"}</p>
                            )}
                          </td>
                          <td className="menu-table-td">
                            <button
                              className="quantity-btn"
                              onClick={() => handleQuantityChange(category, subcategory, item.id, "decrease")}
                            >
                              ➖
                            </button>
                            <span className="quantity-text">{item.quantity}</span>
                            <button
                              className="quantity-btn"
                              onClick={() => handleQuantityChange(category, subcategory, item.id, "increase")}
                            >
                              ➕
                            </button>
                          </td>
                          <td className="menu-table-td">
                            <button
                              className="add-to-cart"
                              onClick={() => handleAddToCart(category, subcategory, item.id)}
                            >
                              {addedItems[item.id] ? "✔ Added!" : "Add to Cart"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        ))
      ) : (
        <p className="no-items-message">No items available.</p>
      )}
    </div>
  );
};

export default Menu;
