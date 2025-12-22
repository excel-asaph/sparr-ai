import React from 'react';
import { Home, Mic, FileText, Grid, Settings, User, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const LeftSidebar = ({ isCollapsed, setIsCollapsed, activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'mock-interview', icon: Mic, label: 'Mock Interview' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'spaces', icon: Grid, label: 'Spaces' },
    ];

    return (
        <motion.div
            initial={{ width: isCollapsed ? 80 : 280 }}
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
            className="h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800 relative z-20 flex-shrink-0"
        >
            {/* Branding */}
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        SPARR AI
                    </span>
                )}
                {isCollapsed && <span className="text-xl font-bold text-blue-500">S</span>}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${activeTab === item.id
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-400' : ''}`} />

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

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-800 space-y-2">
                <button className={`w-full flex items-center p-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all ${isCollapsed ? 'justify-center' : ''}`}>
                    <Settings className="w-5 h-5" />
                    {!isCollapsed && <span className="ml-3 font-medium text-sm">Settings</span>}
                </button>

                <button className={`w-full flex items-center p-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        JD
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 text-left overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">Jane Doe</p>
                            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                        </div>
                    )}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-30"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </motion.div>
    );
};

export default LeftSidebar;
