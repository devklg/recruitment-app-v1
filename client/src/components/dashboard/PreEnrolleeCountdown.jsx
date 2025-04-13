import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PreEnrolleeCountdown = ({
    queuePosition,
    totalPreEnrollees,
    launchDate,
    expiryDate
}) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    const [showWarning, setShowWarning] = useState(false);

    // Calculate remaining time until launch
    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(launchDate) - new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [launchDate]);

    // Show warning periodically
    useEffect(() => {
        const warningInterval = setInterval(() => {
            setShowWarning(true);

            setTimeout(() => {
                setShowWarning(false);
            }, 8000);
        }, 30000); // Show warning every 30 seconds

        return () => clearInterval(warningInterval);
    }, []);

    const daysProgress = ((7 - timeLeft.days) / 7) * 100;

    return (
        <div className="bg-navy p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Launch Countdown</h2>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {timeLeft.days.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white text-sm">Days</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white text-sm">Hours</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white text-sm">Minutes</div>
                </div>

                <div className="bg-darkNavy p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gold">
                        {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white text-sm">Seconds</div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <div className="text-white">7 Days Pre-Launch Period</div>
                    <div className="text-gold font-medium">{Math.round(daysProgress)}% Complete</div>
                </div>
                <div className="w-full bg-darkNavy rounded-full h-2.5">
                    <div
                        className="bg-gold h-2.5 rounded-full"
                        style={{ width: `${daysProgress}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-darkNavy p-4 rounded-lg mb-6">
                <div className="flex justify-between mb-2">
                    <div className="text-white">Your Position in Queue:</div>
                    <div className="text-gold font-bold">{queuePosition} of {totalPreEnrollees}</div>
                </div>

                <div className="w-full bg-navy rounded-full h-2.5 mb-4">
                    <div
                        className="bg-royalBlue h-2.5 rounded-full"
                        style={{ width: `${(queuePosition / totalPreEnrollees) * 100}%` }}
                    ></div>
                </div>

                <div className="text-white text-sm">
                    {totalPreEnrollees - queuePosition} people will be placed below you in the team structure
                </div>
            </div>

            <motion.div
                className={`bg-red-800 p-4 rounded-lg text-white mb-6 ${showWarning ? 'block' : 'hidden'}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="font-bold mb-1">Warning: Don't Miss Your Opportunity!</div>
                <div className="text-sm">
                    Your pre-enrollment expires in {Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days.
                    If you don't activate your position, others will move ahead of you in the structure.
                </div>
            </motion.div>

            <button className="w-full bg-gradient-to-r from-royalBlue to-gold text-white font-bold py-3 rounded-lg hover:from-gold hover:to-royalBlue transition-all duration-300">
                Activate Your Position Now
            </button>
        </div>
    );
};

export default PreEnrolleeCountdown; 