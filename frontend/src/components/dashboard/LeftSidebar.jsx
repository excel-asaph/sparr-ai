import React from 'react';
import { Home, Mic, FileText, Grid, PanelLeft, CassetteTape, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const LeftSidebar = ({ isCollapsed, setIsCollapsed, activeTab, setActiveTab }) => {
    const { currentUser } = useAuth();

    // Get user info for avatar
    const displayName = currentUser?.displayName || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const photoURL = currentUser?.photoURL;

    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'reports', icon: CassetteTape, label: 'Reports' },
        { id: 'spaces', icon: LayoutDashboard, label: 'Spaces' },
    ];

    return (
        <motion.div
            initial={{ width: isCollapsed ? 80 : 280 }}
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full bg-white text-gray-600 flex flex-col rounded-2xl shadow-sm border border-white/50 relative z-20 flex-shrink-0"
        >
            {/* Header: Brand & Toggle */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>

                {/* Brand Text (Only visible when expanded) */}
                {!isCollapsed && (
                    <span className="text-2xl font-black tracking-tighter text-gray-900">
                        SPARR
                    </span>
                )}

                {/* Toggle Button (Always visible) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <PanelLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${activeTab === item.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : ''}`} />

                        {!isCollapsed && (
                            <span className="ml-3 font-medium text-sm">{item.label}</span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom: Profile Button Only */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${activeTab === 'profile'
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                >
                    {/* Avatar */}
                    {photoURL ? (
                        <img
                            src={photoURL}
                            alt={displayName}
                            className={`w-8 h-8 min-w-[32px] min-h-[32px] aspect-square shrink-0 rounded-full border-2 object-cover ${activeTab === 'profile' ? 'border-blue-300' : 'border-gray-200'}`}
                        />
                    ) : (
                        <div className={`w-8 h-8 min-w-[32px] min-h-[32px] aspect-square shrink-0 rounded-full bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center text-xs font-bold text-white shadow-sm ${activeTab === 'profile' ? 'ring-2 ring-blue-300' : ''
                            }`}>
                            {initials}
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="ml-3 text-left overflow-hidden">
                            <p className={`text-sm font-bold truncate ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-700'}`}>
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">View Profile</p>
                        </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                            Profile
                        </div>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default LeftSidebar;
