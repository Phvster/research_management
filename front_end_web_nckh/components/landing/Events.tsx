'use client';

import React from 'react';
import { ArrowRightOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

export default function Events() {
    const newsList = [
        {
            id: 1,
            date: "15 Tháng 5, 2024",
            title: "Thông báo đăng ký đề tài NCKH sinh viên 2024-2025",
        },
        {
            id: 2,
            date: "12 Tháng 5, 2024",
            title: "Hướng dẫn trình bày báo cáo tổng kết đề tài",
        }
    ];

    const events = [
        {
            id: 1,
            day: "20",
            month: "TH5",
            title: "Hội thảo về AI trong Mật mã",
            time: "09:00 - Hội trường A1",
        },
        {
            id: 2,
            day: "25",
            month: "TH5",
            title: "Hạn cuối nộp đề cương NCKH",
            time: "17:00 - Văn phòng Khoa",
        }
    ];

    return (
        <section className="bg-gray-50 py-20 px-6 lg:px-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tin tức mới nhất</h2>
                        <button className="text-primary hover:font-bold transition-colors text-sm font-semibold flex items-center gap-2">
                            Xem tất cả <ArrowRightOutlined />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {newsList.map((news) => (
                            <div
                                key={news.id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="text-xs font-semibold text-gray-400 mb-2">{news.date}</div>
                                <h3 className="text-lg font-bold text-gray-800">{news.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800">Tháng 5, 2024</h3>
                            <div className="flex gap-3 text-gray-400 text-sm cursor-pointer">
                                <LeftOutlined className="hover:text-primary transition-colors" />
                                <RightOutlined className="hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-y-4 text-center text-xs font-medium">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                <div key={d} className="text-gray-400">{d}</div>
                            ))}
                            <div className="text-gray-300">29</div>
                            <div className="text-gray-300">30</div>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(d => (
                                <div key={`d1-${d}`} className="text-gray-700">{d}</div>
                            ))}
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto shadow-md">
                                15
                            </div>
                            {[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(d => (
                                <div key={`d2-${d}`} className="text-gray-700">{d}</div>
                            ))}
                            <div className="text-gray-300">1</div>
                            <div className="text-gray-300">2</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Sự kiện sắp tới</h3>
                        <div className="space-y-4">
                            {events.map((evt) => (
                                <div key={evt.id} className="flex gap-4 items-start bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary-light transition-colors cursor-pointer">
                                    <div className="bg-primary-light text-primary rounded-lg p-2 text-center min-w-[50px]">
                                        <div className="text-[10px] font-bold uppercase">{evt.month}</div>
                                        <div className="text-lg font-black leading-none mt-1">{evt.day}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800 mb-1">{evt.title}</h4>
                                        <p className="text-xs text-gray-500">{evt.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}