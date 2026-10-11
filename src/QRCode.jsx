import React, { useState, useEffect, useRef } from "react";
import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import { QRCodeCanvas } from "qrcode.react";
import { getAuth } from "firebase/auth";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";

const QRCodeGenerator = () => {
  const [tableCount, setTableCount] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");
  const [qrCodes, setQrCodes] = useState([]);
  const [lastGeneratedDate, setLastGeneratedDate] = useState(null);
  const navigate = useNavigate();

  const db = getDatabase();
  const auth = getAuth();
  const qrContainerRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userId = user.uid;
    const dbRef = ref(db, `tables/${userId}`);

    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const storedQRCodes = Object.keys(data).map((key) => ({
          id: key,
          text: data[key].qrText,
          createdAt: data[key].createdAt,
        }));
        setQrCodes(storedQRCodes);

        // Fetch last generated timestamp
        const lastGenTimestamp = data["lastGenerated"]?.createdAt || null;
        if (lastGenTimestamp) {
          setLastGeneratedDate(new Date(lastGenTimestamp));
        }
      }
    });
  }, [auth]);

  const canGenerateNewQR = () => {
    if (!lastGeneratedDate) return true; // No previous QR codes exist

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return lastGeneratedDate < oneMonthAgo;
  };

  const generateQRCodes = async () => {
    if (!restaurantName || tableCount <= 0) {
      alert("Please enter a valid restaurant name and number of tables!");
      return;
    }
    if (!canGenerateNewQR()) {
      alert("You can only generate QR codes once per month!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in!");
      return;
    }

    const userId = user.uid;
    const dbRef = ref(db, `tables/${userId}`);
    const snapshot = await get(dbRef);
    const existingTables = snapshot.val() || {};

    let newQRCodes = [];
    for (let i = 1; i <= tableCount; i++) {
      const tableId = `table-${i}`;
      if (!existingTables[tableId]) {
        const qrText = `${restaurantName}-Table-${i}`;
        newQRCodes.push({ id: tableId, text: qrText });

        set(ref(db, `tables/${userId}/${tableId}`), {
          qrText,
          createdAt: Date.now(),
        });
      }
    }

    setQrCodes([...qrCodes, ...newQRCodes]);
    set(ref(db, `tables/${userId}/lastGenerated`), { createdAt: Date.now() });

    alert("QR Codes Generated & Stored Successfully!");
  };

  const downloadQRCodeAsPNG = (qrText, id) => {
    const qrElement = document.getElementById(`qr-${id}`);
    if (!qrElement) return;

    html2canvas(qrElement).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${qrText}.png`;
      link.click();
    });
  };

  const downloadAllAsPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let yPosition = 10;

    qrCodes.forEach((qr, index) => {
      const qrElement = document.getElementById(`qr-${qr.id}`);
      if (!qrElement) return;
      html2canvas(qrElement).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 10, yPosition, 50, 50);
        pdf.text(qr.text, 70, yPosition + 25);
        yPosition += 60;
        if (index < qrCodes.length - 1) pdf.addPage();
        if (index === qrCodes.length - 1) pdf.save("QRCode_List.pdf");
      });
    });
  };

  return (
    <div className="qrcode-container">
      <h3>Generate QR Codes for Your Restaurant</h3>
      <input
        type="text"
        placeholder="Enter Restaurant Name"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Enter Number of Tables"
        value={tableCount}
        onChange={(e) => setTableCount(parseInt(e.target.value))}
      />
      <button onClick={generateQRCodes} disabled={!canGenerateNewQR()}>
        Generate QR Codes
      </button>
      <button className="back-btn" onClick={() => navigate("/admin")}>Back to Admin Panel</button>


      <div className="qr-grid" ref={qrContainerRef}>
        {qrCodes.length > 0 ? (
          qrCodes.map((qr) => (
            <div key={qr.id} className="qr-card">
              <div id={`qr-${qr.id}`} className="qr-box">
                <QRCodeCanvas value={qr.text} />
              </div>
              <p>{qr.text}</p>
              <button onClick={() => downloadQRCodeAsPNG(qr.text, qr.id)}>
                Download PNG
              </button>
            </div>
          ))
        ) : (
          <p>No QR Codes Found</p>
        )}
      </div>

      {qrCodes.length > 0 && (
        <button onClick={downloadAllAsPDF}>Download All as PDF</button>
        
      )}
    </div>
  );
};

export default QRCodeGenerator;
