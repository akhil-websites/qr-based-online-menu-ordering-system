import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from './firebaseConfig';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import './history.css';

const History = () => {
  const [data, setData] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();
  

  useEffect(() => {
    const ordersRef = ref(rtdb, 'orders/');
    onValue(ordersRef, (snapshot) => {
      const rawData = snapshot.val() || {};
      const formattedData = Object.values(rawData).map(order => ({
        table: order.table.split('/').pop(),
        name: order.user.name,
        phone: order.user.phone,
        orderDate: format(new Date(order.timestamp), 'yyyy-MM-dd'),
        orderTime: format(new Date(order.timestamp), 'hh:mm a')
      }));
      setData(formattedData);
    });
  }, []);

  const filteredData = filterDate
    ? data.filter(item => item.orderDate === filterDate)
    : data;

  const downloadCSV = () => {
    const headers = ['Table No', 'Name', 'Phone', 'Order Date', 'Order Time'];
    const rows = filteredData.map(item => [
      item.table, item.name, item.phone, item.orderDate, item.orderTime
    ]);
    let csvContent = 'data:text/csv;charset=utf-8,'
      + [headers, ...rows].map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'all-tables-history.csv');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="history-container">
      <h2>Booking History (All Tables)</h2>

      <div className="controls">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-input"
        />
        <button className="download-btn" onClick={downloadCSV}>
          Download CSV
        </button>
      </div>

      <table className="history-table">
        <thead>
          <tr>
            <th>Table No</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Order Date</th>
            <th>Order Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.table}</td>
              <td>{item.name}</td>
              <td>{item.phone}</td>
              <td>{item.orderDate}</td>
              <td>{item.orderTime}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5">No Records Found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default History;
