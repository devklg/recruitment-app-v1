import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// eslint-disable-next-line no-unused-vars
const TeamGrowthVisualization = ({ userData, teamData }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [newMember, setNewMember] = useState(null);
  
  // Simulate new members joining for demo purposes
  // In production, this would use WebSockets or polling
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly decide if a new member joins
      if (Math.random() > 0.7) {
        const fakeMember = {
          id: Date.now(),
          name: `New Member ${Math.floor(Math.random() * 100)}`,
          position: Math.random() > 0.5 ? 'left' : 'right',
          timestamp: new Date()
        };
        
        setNewMember(fakeMember);
        setShowNotification(true);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    }, 20000); // Check every 20 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative">
      <h3 className="text-xl font-semibold text-white mb-6">Your Growing Team</h3>
      
      {/* Team Visualization */}
      <div className="bg-darkNavy p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          {/* You at the top */}
          <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center mb-2 z-10">
            <span className="text-navy font-bold">YOU</span>
          </div>
          
          {/* Connection line */}
          <div className="w-1 h-12 bg-gold"></div>
          
          {/* First level */}
          <div className="flex justify-center items-start space-x-32 mb-2">
            <div className="flex flex-col items-center">
              <motion.div 
                className={`w-14 h-14 rounded-full flex items-center justify-center 
                  ${teamData.leftLeg ? 'bg-royalBlue' : 'bg-gray-700'}`}
                whileHover={{ scale: 1.1 }}
              >
                {teamData.leftLeg ? (
                  <span className="text-white text-xs">{teamData.leftLeg.name.charAt(0)}</span>
                ) : (
                  <span className="text-gray-400 text-xs">Open</span>
                )}
              </motion.div>
              <div className="text-xs text-gray-400 mt-1">Left</div>
              {teamData.leftLeg && (
                <div className="text-xs text-white">{teamData.leftLegCount} members</div>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <motion.div 
                className={`w-14 h-14 rounded-full flex items-center justify-center 
                  ${teamData.rightLeg ? 'bg-royalBlue' : 'bg-gray-700'}`}
                whileHover={{ scale: 1.1 }}
              >
                {teamData.rightLeg ? (
                  <span className="text-white text-xs">{teamData.rightLeg.name.charAt(0)}</span>
                ) : (
                  <span className="text-gray-400 text-xs">Open</span>
                )}
              </motion.div>
              <div className="text-xs text-gray-400 mt-1">Right</div>
              {teamData.rightLeg && (
                <div className="text-xs text-white">{teamData.rightLegCount} members</div>
              )}
            </div>
          </div>
          
          {/* Connection lines to second level */}
          <div className="flex justify-center w-full relative">
            <div className="absolute left-1/4 w-1 h-10 bg-gold transform -translate-x-1/2"></div>
            <div className="absolute right-1/4 w-1 h-10 bg-gold transform translate-x-1/2"></div>
          </div>
          
          {/* Additional levels would go here */}
        </div>
        
        {/* Team statistics */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-navy p-4 rounded-lg">
            <div className="text-3xl font-bold text-gold">{teamData.totalMembers || 0}</div>
            <div className="text-white text-sm">Total Team Members</div>
          </div>
          <div className="bg-navy p-4 rounded-lg">
            <div className="text-3xl font-bold text-gold">{teamData.newMembersToday || 0}</div>
            <div className="text-white text-sm">New Today</div>
          </div>
        </div>
      </div>
      
      {/* New member notification */}
      <AnimatePresence>
        {showNotification && newMember && (
          <motion.div 
            className="absolute top-0 right-0 bg-royalBlue text-white p-4 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="font-bold">New Team Member!</div>
            <div className="text-sm">
              {newMember.name} just joined your {newMember.position} team!
            </div>
            <div className="text-xs mt-1 text-gray-200">
              {Math.ceil((Date.now() - newMember.timestamp) / 1000)} seconds ago
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamGrowthVisualization;