'use client'
import React from 'react';
import Link from 'next/link';

export default function FooterLanding() {
    return (
        <section className="bg-primary py-14 px-6 text-center text-white">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Bạn đã sẵn sàng để bắt đầu hành trình nghiên cứu?
                </h2>
                <p className="max-w-2xl mx-auto text-red-100 mb-8 text-lg">
                    Đăng nhập bằng tài khoản sinh viên/giảng viên để truy cập kho tài liệu, đăng ký đề tài và theo dõi tiến độ nghiên cứu của bạn.
                </p>
                <Link href="/login" className="bg-white text-primary px-10 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-xl">
                    Đăng nhập ngay
                </Link>
            </div>
        </section>
    );
}