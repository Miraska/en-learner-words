'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '../../lib/auth';
import { BookOpen, User, Heart, GraduationCap, LogOut, LogIn, UserPlus, Library, Globe, Menu, X, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!auth.getToken());
        const onAuthChange = (e: Event) => {
            const detail = (e as CustomEvent).detail as { isLoggedIn?: boolean } | undefined;
            if (detail && typeof detail.isLoggedIn === 'boolean') {
                setIsLoggedIn(detail.isLoggedIn);
            } else {
                setIsLoggedIn(!!auth.getToken());
            }
        };
        window.addEventListener('auth:change', onAuthChange as EventListener);
        return () => {
            window.removeEventListener('auth:change', onAuthChange as EventListener);
        };
    }, []);

    const handleLogout = () => {
        auth.removeToken();
        setIsLoggedIn(false);
        setIsMobileMenuOpen(false);
        window.location.href = '/auth/login';
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
        <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-xl border-b border-slate-700/50">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center py-3 sm:py-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group" onClick={closeMobileMenu} aria-label="Go to WordCraft homepage">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-200">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                            WordCraft
                        </span>
                        {/* Alpha Badge */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setIsReportModalOpen(true);
                            }}
                            className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors shadow-lg"
                            title="Project Status & Feedback"
                        >
                            ALPHA
                        </button>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden min-[551px]:flex items-center gap-1">
                        {isLoggedIn && (
                            <Link 
                                href="/dictionaries/my" 
                                className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                aria-label="View my personal dictionaries"
                            >
                                <Library className="w-4 h-4" />
                                <span className="hidden min-[1051px]:inline">My Dictionaries</span>
                            </Link>
                        )}
                        
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                            aria-label="Explore public dictionaries"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="hidden min-[1051px]:inline">Explore</span>
                        </Link>
                        
                        <Link 
                            href="/profile" 
                            className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                            aria-label="View my profile and learning progress"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden min-[1051px]:inline">Profile</span>
                        </Link>
                        
                        {isLoggedIn && (
                            <Link 
                                href="/profile/likes" 
                                className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                            >
                                <Heart className="w-4 h-4" />
                                <span className="hidden min-[1051px]:inline">Likes</span>
                            </Link>
                        )}
                        
                        {isLoggedIn && (
                            <Link
                                href="/profile/learned"
                                className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                            >
                                <GraduationCap className="w-4 h-4" />
                                <span className="hidden min-[1051px]:inline">Learned</span>
                            </Link>
                        )}

                        {/* Auth buttons */}
                        <div className="ml-2 pl-2 border-l border-slate-600">
                            {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                                aria-label="Sign out of your account"
                            >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden min-[1051px]:inline">Logout</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1">
                                <Link 
                                    href="/auth/login" 
                                    className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                    aria-label="Sign in to your account"
                                >
                                        <LogIn className="w-4 h-4" />
                                        <span className="hidden min-[1051px]:inline">Login</span>
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                                        aria-label="Create a new account"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span className="hidden min-[1051px]:inline">Register</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="min-[551px]:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="min-[551px]:hidden border-t border-slate-700/50 py-4">
                        <div className="flex flex-col space-y-2">
                            {isLoggedIn && (
                                <Link 
                                    href="/dictionaries/my" 
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                    onClick={closeMobileMenu}
                                    aria-label="View my personal dictionaries"
                                >
                                    <Library className="w-5 h-5" />
                                    <span>My Dictionaries</span>
                                </Link>
                            )}
                            
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                onClick={closeMobileMenu}
                                aria-label="Explore public dictionaries"
                            >
                                <Globe className="w-5 h-5" />
                                <span>Explore</span>
                            </Link>
                            
                            <Link 
                                href="/profile" 
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                onClick={closeMobileMenu}
                                aria-label="View my profile and learning progress"
                            >
                                <User className="w-5 h-5" />
                                <span>Profile</span>
                            </Link>
                            
                            {isLoggedIn && (
                                <Link 
                                    href="/profile/likes" 
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                    onClick={closeMobileMenu}
                                    aria-label="View my liked dictionaries"
                                >
                                    <Heart className="w-5 h-5" />
                                    <span>Likes</span>
                                </Link>
                            )}
                            
                            {isLoggedIn && (
                                <Link 
                                    href="/profile/learned" 
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                    onClick={closeMobileMenu}
                                    aria-label="View my learned words"
                                >
                                    <GraduationCap className="w-5 h-5" />
                                    <span>Learned</span>
                                </Link>
                            )}

                            {/* Mobile Auth Section */}
                            <div className="border-t border-slate-700/50 pt-4 mt-4">
                                {isLoggedIn ? (
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full"
                                        aria-label="Sign out of your account"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>Logout</span>
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                            <Link 
                                href="/auth/login" 
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                                onClick={closeMobileMenu}
                                aria-label="Sign in to your account"
                            >
                                            <LogIn className="w-5 h-5" />
                                            <span>Login</span>
                                        </Link>
                                        <Link
                                            href="/auth/register"
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                                            onClick={closeMobileMenu}
                                            aria-label="Create a new account"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            <span>Register</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
        
        {/* Report Modal */}
        <ReportModal 
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            isLoggedIn={isLoggedIn}
        />
    </>
    );
}
