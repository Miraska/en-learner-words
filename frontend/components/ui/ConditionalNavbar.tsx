'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
    const pathname = usePathname();
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;
    const legacyAdminPath = '/admin-panel-x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8';
    const isAdminPanel = (adminPath && pathname?.startsWith(adminPath)) || pathname?.startsWith(legacyAdminPath);
    if (isAdminPanel) return null;
    return <Navbar />;
}


