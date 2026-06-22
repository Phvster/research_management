'use client';
import Link from 'next/link';

export default function HeaderLanding() {
    return (
        <header className="border-b border-red-200 w-full bg-white border-b border-gray-100 py-4 px-6 lg:px-20 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <img src="/logo-kma.png" alt="Logo KMA" className="h-10 w-auto" />
                <span className="text-primary font-bold text-lg uppercase">Học viện Kỹ thuật Mật mã</span>
            </div>
            <nav className="flex items-center gap-8">
                <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-primary border-b-2 border-transparent hover:border-primary transition-all">
                    Trang chủ
                </Link>
                <Link href="/login" className="bg-primary text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-primary-hover transition-colors">
                    Đăng nhập
                </Link>
            </nav>
        </header>
    );
}