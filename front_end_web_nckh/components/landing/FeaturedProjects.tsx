'use client';

import React from 'react';
import { TrophyOutlined, UserOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

export default function FeaturedProjects() {
    const projects = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500",
            tag: "GIẢI NHẤT",
            title: "Hệ thống phát hiện xâm nhập AI-Driven",
            author: "TS. Nguyễn Văn A (Chủ trì)",
            year: "2023"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=500",
            tag: "GIẢI NHÌ",
            title: "Ứng dụng Blockchain trong Quản lý Dữ liệu",
            author: "ThS. Lê Thị B",
            year: "2024"
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=500",
            tag: "GIẢI BA",
            title: "Phân tích mật mã lượng tử và Ứng dụng",
            author: "TS. Trần Văn C",
            year: "2022"
        }
    ];

    return (
        <section className="bg-white text-black pt-10 pb-24 px-6 lg:px-20">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10 border-b border-gray-800 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Đề tài tiêu biểu</h2>
                        <div className="w-16 h-1 bg-primary"></div>
                    </div>
                    <button className="text-primary hover:font-bold transition-colors text-sm font-semibold flex items-center gap-2">
                        Xem tất cả danh sách <ArrowRightOutlined />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white text-gray-900 rounded-xl overflow-hidden flex flex-col shadow-lg transition-transform hover:-translate-y-2 duration-300">
                            <div className="relative h-48 overflow-hidden">
                                <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <TrophyOutlined className="text-amber-500" /> {project.tag}
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-bold mb-4 line-clamp-2 min-h-[3.5rem] leading-tight">
                                    {project.title}
                                </h3>

                                <div className="text-sm text-gray-500 flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-2">
                                        <UserOutlined /> <span>{project.author}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockCircleOutlined /> <span>Hoàn thành: {project.year}</span>
                                    </div>
                                </div>
                                <button className="mt-auto w-full py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary hover:border-primary transition-all">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}