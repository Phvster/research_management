'use client';

import React from 'react';
import { RocketOutlined } from '@ant-design/icons';

export default function HeroSection() {
    return (
        <section className="relative pt-20 pb-32 lg:pt-28 lg:pb-40 px-6 lg:px-20 max-w-[1440px] mx-auto w-full flex items-center overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-100 to-transparent opacity-60 -z-10 bg-cover bg-right" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000')" }}>
                <div className="absolute inset-0 bg-white/60"></div>
            </div>
            <div className="w-full max-w-3xl z-10">
                <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black mb-6 tracking-tight leading-[1.1] text-left">
                    <span className="text-primary block mb-2">HỆ THỐNG QUẢN LÝ</span>
                    <span className="text-primary block mb-3">NGHIÊN CỨU KHOA HỌC</span>
                    <span className="text-gray-900 block text-5xl md:text-6xl lg:text-[72px]">ACTVN Research</span>
                </h1>
                <div className="bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-8">
                    <RocketOutlined className="text-sm" /> Trí thức và Công nghệ
                </div>
                <p className="text-gray-500 max-w-xl mt-6 mb-10 text-base md:text-lg leading-relaxed text-left">
                    Nền tảng quản lý và hỗ trợ nghiên cứu khoa học chuyên sâu dành cho sinh
                    viên và giảng viên Học viện Kỹ thuật Mật mã. Nâng tầm ý tưởng, kiến tạo tương lai.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button className="bg-primary text-white px-8 py-3.5 rounded-md font-semibold hover:bg-primary-hover transition-colors shadow-lg shadow-red-900/20 w-full sm:w-auto">
                        Khám phá ngay
                    </button>
                    <button className="bg-white text-primary border border-primary px-8 py-3.5 rounded-md font-semibold hover:bg-red-50 transition-colors w-full sm:w-auto">
                        Quy chế NCKH
                    </button>
                </div>
            </div>
        </section>
    );
}