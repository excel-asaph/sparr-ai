import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SiGoogle } from 'react-icons/si';

const LoginPage = () => {
    const { loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Detect if coming from onboarding flow
    const isFromOnboarding = searchParams.get('from') === 'onboarding';

    // Redirect to where they came from (with state), or dashboard
    const targetLocation = location.state?.from || { pathname: '/dashboard' };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate(targetLocation, {
                replace: true,
                state: location.state?.pendingSession
            });
        } catch (err) {
            console.error("Login Failed", err);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white relative overflow-hidden font-sans text-gray-900 flex">
            {/* Left Panel - Branding */}
            <div className="w-[40%] relative flex flex-col justify-center bg-gray-50 pl-16">
                {/* Grid Pattern Background */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                                     linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}></div>

                {/* Ambient Gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />

                {/* Laser Scan Line */}
                <motion.div
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.5)] pointer-events-none z-0"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{
                        duration: 12,
                        ease: "linear",
                        repeat: Infinity
                    }}
                />

                {/* Branding Content */}
                <div className="relative z-10 flex flex-col items-start">
                    {/* Logo Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <span className="text-gray-900 text-sm font-bold tracking-[0.3em] uppercase border border-gray-300 bg-gray-100 px-4 py-2 rounded-full">
                            Sparr AI
                        </span>
                    </motion.div>

                    {/* Hero Text */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-extrabold tracking-tight text-gray-900"
                    >
                        Survive The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Interview.</span>
                    </motion.h1>
                </div>
            </div>

            {/* Right Panel - Sign In */}
            <div className="w-[60%] flex flex-col justify-center items-center bg-white px-24">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Welcome Header */}
                    <div className="mb-10">
                        <span className="text-blue-600 text-xs font-bold tracking-[0.2em] uppercase mb-3 block">
                            {isFromOnboarding ? 'One Last Step' : 'Authentication'}
                        </span>
                        <h2 className="text-4xl font-bold text-gray-900 mb-3">
                            {isFromOnboarding ? 'Almost there!' : 'Welcome back'}
                        </h2>
                        <p className="text-gray-500">
                            {isFromOnboarding
                                ? 'Sign in to start your interview session.'
                                : 'Sign in to save your progress and access your spaces.'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl mb-6"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Google Sign In Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <SiGoogle className="text-xl group-hover:scale-110 transition-transform" />
                                <span>Continue with Google</span>
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
