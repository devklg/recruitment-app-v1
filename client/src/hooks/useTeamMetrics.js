import { useState, useEffect } from 'react';

export const useTeamMetrics = (initialPeriod = '1month') => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState(initialPeriod);

    const fetchTeamMetrics = async () => {
        try {
            setLoading(true);
            // In a real app, this would be an API call
            // Simulating API response for now
            const response = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        totalMembers: 50,
                        activeMembers: 45,
                        growthRate: 15,
                        monthlyGrowth: [
                            { month: 'Jan', members: 30 },
                            { month: 'Feb', members: 35 },
                            { month: 'Mar', members: 42 },
                            { month: 'Apr', members: 50 }
                        ],
                        teamStructure: {
                            levels: 3,
                            distribution: [
                                { level: 1, count: 5 },
                                { level: 2, count: 15 },
                                { level: 3, count: 30 }
                            ]
                        },
                        activityMetrics: {
                            highlyActive: 30,
                            moderatelyActive: 10,
                            lowActive: 5,
                            inactive: 5
                        }
                    });
                }, 500);
            });

            setData(response);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load team metrics');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const refetch = async (params = {}) => {
        setPeriod(params.period || period);
        await fetchTeamMetrics();
    };

    useEffect(() => {
        fetchTeamMetrics();
    }, [period]);

    return {
        data,
        loading,
        error,
        refetch
    };
};
