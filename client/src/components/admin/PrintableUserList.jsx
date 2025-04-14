import React from 'react';
import { formatDate } from '../../utils/formatters';
const PrintableUserList = ({ users, onPrint }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>User List - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { color: #666; }
            .no-sponsor { color: #ff0000; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">User List</div>
            <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Package</th>
                <th>Sponsor</th>
                <th>Enrollment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr>
                  <td>${user.firstName} ${user.lastName}</td>
                  <td>${user.email}</td>
                  <td>${user.phone}</td>
                  <td>${user.role}</td>
                  <td>${user.package}</td>
                  <td class="${!user.sponsor ? 'no-sponsor' : ''}">${user.sponsorName || 'None'}</td>
                  <td>${formatDate(user.enrollmentDate)}</td>
                  <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    if (onPrint) {
      onPrint();
    }
  };
  return (
    <div className="mb-4">
      <button
        onClick={handlePrint}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0v3H7V4h6zm-2 11v-2H9v2h2z" clipRule="evenodd" />
        </svg>
        Print User List
      </button>
    </div>
  );
};
export default PrintableUserList;