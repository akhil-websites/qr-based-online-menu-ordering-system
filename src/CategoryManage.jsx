import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rtdb, storage } from "./firebaseConfig";
import { ref, set, update, remove, onValue, push, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import * as XLSX from "xlsx";
import "./Admin.css";

const CategoryManage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", image: "", subcategory: "", available: true });
  const [file, setFile] = useState(null);

  // ✅ Fetch menu from Realtime Database
  useEffect(() => {
    const menuRef = ref(rtdb, "menu");
  
    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      console.log("Fetched Data from Firebase:", data);
      console.log("Current Category from URL:", category);
  
      const updatedMenu = Object.entries(data)
        .map(([key, value]) => ({ id: key, ...value }))
        .filter((item) => item.category && item.category.toLowerCase() === category?.toLowerCase());
  
      console.log("Filtered Menu Data:", updatedMenu);
  
      setMenu(updatedMenu);
    });
  }, [category]);
  

  // ✅ Prevent Duplicate Items Before Adding
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.image || !newItem.subcategory) {
      alert("❌ Please enter all details!");
      return;
    }

    // ✅ Check if item already exists
    const menuRef = ref(rtdb, "menu");
    const snapshot = await get(menuRef);

    if (snapshot.exists()) {
      const existingItems = Object.values(snapshot.val());
      const itemExists = existingItems.some(item => item.name.toLowerCase() === newItem.name.toLowerCase());

      if (itemExists) {
        alert("❌ Item already exists in the menu!");
        return;
      }
    }

    // ✅ Add new item
    const newItemRef = push(menuRef);
    const newItemData = { ...newItem, category, id: newItemRef.key };

    await set(newItemRef, newItemData);
    setNewItem({ name: "", price: "", image: "", subcategory: "", available: true });

    alert("✅ Item added successfully!");
  };

  // ✅ Upload Image to Firebase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = storageRef(storage, `menuImages/${file.name}`);
    await uploadBytes(fileRef, file);
    const imageURL = await getDownloadURL(fileRef);

    setNewItem((prev) => ({ ...prev, image: imageURL }));
    alert("✅ Image uploaded successfully!");
  };

  // ✅ Edit Item Details
  const handlePriceChange = (itemId, newPrice) => {
    update(ref(rtdb, `menu/${itemId}`), { price: Number(newPrice) });
  };

  const handleSubcategoryChange = (itemId, newSubcategory) => {
    update(ref(rtdb, `menu/${itemId}`), { subcategory: newSubcategory });
  };

  // ✅ Update Item Availability
  const toggleAvailability = (itemId, available) => {
    update(ref(rtdb, `menu/${itemId}`), { available: !available });
  };

  // ✅ Delete Item from Realtime Database
  const handleDeleteItem = (itemId) => {
    remove(ref(rtdb, `menu/${itemId}`));
  };

  // ✅ Handle File Selection (Fixes Error)
  const handleFileUpload = (e) => {
    setFile(e.target.files[0]); 
  };

  // ✅ Handle Excel File Upload
  const handleUploadToDatabase = async () => {
    if (!file) {
      alert("❌ Please select an Excel file!");
      return;
    }
  
    const reader = new FileReader();
    reader.readAsBinaryString(file);
  
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
  
        let parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  
        console.log("Raw Parsed Data:", parsedData); // ✅ Debugging Step
  
        // ✅ Normalize column names and clean data
        parsedData = parsedData.map((item) => ({
          name: item["Name"]?.trim() || "Unknown",
          category: item["Category"]?.trim() || "Uncategorized",
          price: Number(item["Price"]) || 0,
          image: item["Image"]?.trim() || "",
          subcategory: item["Subcategory"] || "",
          available: String(item["Available"]).toLowerCase() === "true",
        }));
  
        console.log("Cleaned Data:", parsedData); // ✅ Debugging Step
  
        if (!parsedData.length) {
          alert("❌ No valid data found in the file! Check console for errors.");
          return;
        }
  
        // ✅ Firebase Upload
        const updates = {};
        parsedData.forEach((item) => {
          const newItemRef = push(ref(rtdb, "menu"));
          updates[newItemRef.key] = {
            ...item,
            id: newItemRef.key,
          };
        });
  
        await update(ref(rtdb, "menu"), updates);
        alert("✅ Excel file uploaded successfully!");
      } catch (error) {
        console.error("❌ Error processing file:", error);
        alert("❌ Failed to read file! Check the console for more details.");
      }
    };
  };
  

  return (
    <div className="admin-panel">
      <h2>Manage {category}</h2>

      {/* ✅ Back to Admin Panel */}
      <button className="back-btn" onClick={() => navigate("/admin")}>
        Back to Admin Panel
      </button>

      {/* ✅ Add New Item */}
      <div className="add-item">
        <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
        <input type="number" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
        <input type="text" placeholder="Subcategory" value={newItem.subcategory} onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })} />
        <input type="file" onChange={handleImageUpload} />
        <button onClick={handleAddItem} className="add-btn">Add Item</button>
      </div>

      {/* ✅ Upload Excel File */}
      <div className="upload-section">
        <h3>Upload Excel File</h3>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        <button className="upload-btn" onClick={handleUploadToDatabase}>Upload to Database</button>
      </div>

      {/* ✅ Display Menu Items */}
      <div className="admin-section">
        <h3>Manage {category} - All Items</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price (₹)</th>
              <th>Subcategory</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menu.map((item) => (
              <tr key={item.id}>
                <td><img src={item.image || "/default-image.jpg"} alt={item.name} className="menu-item-image" /></td>
                <td>{item.name}</td>
                <td><input type="number" value={item.price} onChange={(e) => handlePriceChange(item.id, e.target.value)} /></td>
                <td><input type="text" value={item.subcategory} onChange={(e) => handleSubcategoryChange(item.id, e.target.value)} /></td>
                <td><button onClick={() => toggleAvailability(item.id, item.available)}>{item.available ? "Yes" : "No"}</button></td>
                <td><button onClick={() => handleDeleteItem(item.id)} className="delete-btn">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManage;
