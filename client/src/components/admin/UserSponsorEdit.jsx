import React, { useState, useEffect } from 'react';
import { updateUserSponsor, searchUsers } from '../../services/admin';
const UserSponsorEdit = ({ user, onUpdate }) => {
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(user.sponsor || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!user.sponsor) {
      // Highlight users without sponsors
      setError('This user has no sponsor assigned');
    }
  }, [user]);
  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchSponsors();
    }
  }, [searchTerm]);
  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const result = await searchUsers({
        search: searchTerm,
        role: ['promoter', 'admin'],
        isActive: true
      });
      setSponsors(result.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch potential sponsors');
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSponsor) {
      setError('Please select a sponsor');
      return;
    }
    try {
      setLoading(true);
      await updateUserSponsor(user._id, selectedSponsor);
      setSuccess(true);
      setError(null);
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(false), 3000);
      setLoading(false);
    } catch (err) {
      setError('Failed to update sponsor');
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Change Sponsor</h3>
      
      {!user.sponsor && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">No Sponsor Assigned</p>
          <p>This user currently has no sponsor. Please assign one.</p>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          Sponsor updated successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Search for Sponsor
          </label>
          <input
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Sponsor
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedSponsor}
            onChange={(e) => setSelectedSponsor(e.target.value)}
          >
            <option value="">-- Select Sponsor --</option>
            {sponsors.map(sponsor => (
              <option key={sponsor._id} value={sponsor._id}>
                {sponsor.firstName} {sponsor.lastName} ({sponsor.email})
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Sponsor'}
        </button>
      </form>
    </div>
  );
};
export default UserSponsorEdit;