import React from 'react';
import Card from '../common/Card';

const UserProfile = ({ user }) => {
    // Mock rank progress data
    const rankProgress = {
        current: user?.rank || 'associate',
        next: user?.rank === 'associate' ? '1-star' :
            user?.rank === '1-star' ? '2-star' :
                user?.rank === '2-star' ? '3-star' :
                    user?.rank === '3-star' ? 'diamond' :
                        'double-diamond',
        progress: 65 // Percentage progress to next rank
    };

    const formatRank = (rank) => {
        return rank.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Card variant="dark">
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-royalBlue rounded-full flex items-center justify-center mb-4">
                    {user?.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-4xl font-bold text-white">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white">
                    {user?.firstName} {user?.lastName}
                </h3>

                <div className="bg-gold text-navy text-xs font-bold px-2 py-1 rounded mt-2 mb-4">
                    {formatRank(rankProgress.current).toUpperCase()}
                </div>

                <div className="w-full mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-white text-sm">Rank Progress</span>
                        <span className="text-white text-sm">{rankProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-navy rounded-full h-2.5">
                        <div
                            className="bg-gold h-2.5 rounded-full"
                            style={{ width: `${rankProgress.progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-gray-400 text-xs">{formatRank(rankProgress.current)}</span>
                        <span className="text-gray-400 text-xs">{formatRank(rankProgress.next)}</span>
                    </div>
                </div>

                <div className="w-full space-y-3">
                    <div className="flex justify-between">
                        <span className="text-white">Email:</span>
                        <span className="text-gold">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white">ID:</span>
                        <span className="text-gold">{user?.id || 'TF12345678'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white">Join Date:</span>
                        <span className="text-gold">
                            {user?.activationDate ? new Date(user.activationDate).toLocaleDateString() : 'Apr 1, 2025'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white">Package:</span>
                        <span className="text-gold">
                            {user?.package?.charAt(0).toUpperCase() + user?.package?.slice(1) || 'Elite'}
                        </span>
                    </div>
                </div>

                <button className="mt-6 text-gold hover:underline text-sm">
                    Edit Profile
                </button>
            </div>
        </Card>
    );
};

export default UserProfile; 