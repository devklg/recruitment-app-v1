import React from 'react';
import Card from '../common/Card';

const FinancialSummary = ({ data }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Financial Summary</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {formatCurrency(data.currentEarnings)}
                    </div>
                    <div className="text-white text-sm">Total Earnings</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {formatCurrency(data.pendingCommissions)}
                    </div>
                    <div className="text-white text-sm">Pending</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {formatCurrency(data.fastStartBonuses)}
                    </div>
                    <div className="text-white text-sm">Fast Start Bonuses</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {formatCurrency(data.teamCommissions)}
                    </div>
                    <div className="text-white text-sm">Team Commissions</div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="pb-3 text-white">Type</th>
                            <th className="pb-3 text-white">Date</th>
                            <th className="pb-3 text-white">Amount</th>
                            <th className="pb-3 text-white">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.recentTransactions.map(transaction => (
                            <tr key={transaction.id}>
                                <td className="py-3">
                                    <span className={`inline-block px-2 py-1 rounded text-xs ${transaction.type === 'fast-start-bonus' ? 'bg-green-800 text-white' :
                                            transaction.type === 'team-commission' ? 'bg-blue-800 text-white' :
                                                transaction.type === 'mega-matching-bonus' ? 'bg-purple-800 text-white' :
                                                    'bg-gray-800 text-white'
                                        }`}>
                                        {transaction.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                </td>
                                <td className="py-3 text-white">
                                    {formatDate(transaction.date)}
                                </td>
                                <td className="py-3 text-gold font-medium">
                                    {formatCurrency(transaction.amount)}
                                </td>
                                <td className="py-3 text-white">
                                    {transaction.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-center">
                <a href="#" className="text-gold hover:underline text-sm">
                    View All Transactions
                </a>
            </div>
        </Card>
    );
};

export default FinancialSummary; 