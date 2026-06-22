import React from 'react';

const StatsSection = () => {
    const stats = [
        { number: "128+", label: "ĐỀ TÀI ĐANG THỰC HIỆN" },
        { number: "450+", label: "SINH VIÊN THAM GIA" },
        { number: "35", label: "GIẢI THƯỞNG QUỐC GIA" },
        { number: "12", label: "PHÒNG THÍ NGHIỆM" },
    ];

    return (
        <section className="bg-white relative pb-20 mt-16">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-20 w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -translate-y-1/2">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl p-6 text-center shadow-xl border border-red-500 flex flex-col justify-center min-h-[120px]"
                        >
                            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                                {stat.number}
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default StatsSection;