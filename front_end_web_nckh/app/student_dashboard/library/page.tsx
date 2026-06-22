'use client';

import React, { useState, useEffect } from 'react';
import { Pagination, Divider, Spin, message, ConfigProvider } from 'antd';
import {
    FilePdfFilled,
    FileWordFilled,
    BookFilled,
    DownloadOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

interface DocumentItem {
    id: string;
    MaTaiLieu?: string; // Khớp với trường của DB nếu có
    title: string;
    TenTaiLieu?: string;
    description: string;
    TomTat?: string;
    category: 'Quy định' | 'Biểu mẫu' | 'Hướng dẫn';
    LoaiTaiLieu?: string;
    fileType: 'pdf' | 'doc' | 'book';
    DinhDangFile?: string;
    updatedAt: string;
    NgayCapNhat?: string;
    FileLink?: string;
}

export default function LibraryPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [messageApi, contextHolder] = message.useMessage();

    const filters = ['Tất cả', 'Biểu mẫu', 'Quy định', 'Hướng dẫn'];

    // ================= TẢI DỮ LIỆU TỪ BACKEND =================
    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await sendRequest<any>({
                url: 'http://localhost:8000/api/tai-lieu/',
                method: 'GET'
            });

            const rawData = res.results || res || [];

            // Map dữ liệu linh hoạt phòng trường hợp Backend dùng tiếng Việt có dấu
            const mappedData = rawData.map((item: any) => ({
                id: item.id || item.MaTaiLieu,
                title: item.title || item.TenTaiLieu,
                description: item.description || item.TomTat || item.NoiDung,
                category: item.category || item.LoaiTaiLieu,
                fileType: item.fileType || item.DinhDangFile || 'pdf',
                updatedAt: item.updatedAt || (item.NgayCapNhat ? new Date(item.NgayCapNhat).toLocaleDateString('vi-VN') : 'Vừa xong'),
                FileLink: item.FileLink || '#'
            }));

            setDocuments(mappedData);
        } catch (error) {
            messageApi.error("Không thể tải danh mục tài liệu hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Logic lọc danh mục
    const filteredDocs = activeFilter === 'Tất cả'
        ? documents
        : documents.filter(doc => doc.category === activeFilter);

    const renderFileIcon = (type: string) => {
        if (type === 'pdf') return <FilePdfFilled className="text-3xl" style={{ color: '#ff4d4f' }} />;
        if (type === 'doc' || type === 'docx') return <FileWordFilled className="text-3xl" style={{ color: '#1677ff' }} />;
        return <BookFilled className="text-3xl" style={{ color: '#52c41a' }} />;
    };

    const renderTagStyle = (category: string) => {
        if (category === 'Quy định') return 'bg-[#FFFBE6] text-[#D48806]';
        if (category === 'Biểu mẫu') return 'bg-[#FFF0F6] text-[#C41D7F]';
        return 'bg-[#F6FFED] text-[#389E0D]';
    };

    if (loading) return <div className="p-10 text-center"><Spin size="large" className="mt-20" /></div>;

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-10">
                {contextHolder}

                {/* ================= HEADER & BỘ LỌC ================= */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6 border-b border-[#A31D1D]/30 pb-6">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl md:text-[28px] font-black text-gray-900 mb-2">Thư viện tài liệu</h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Tổng hợp các biểu mẫu, quy định và hướng dẫn phục vụ hoạt động nghiên cứu khoa học sinh viên tại Học viện.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => {
                                    setActiveFilter(filter);
                                    setCurrentPage(1);
                                }}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeFilter === filter
                                    ? 'bg-[#A31D1D] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ================= LƯỚI TÀI LIỆU DỮ LIỆU THẬT ================= */}
                {filteredDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                        {filteredDocs.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 flex flex-col p-5 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        {renderFileIcon(doc.fileType)}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${renderTagStyle(doc.category)}`}>
                                        {doc.category}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug line-clamp-2 group-hover:text-[#A31D1D] transition-colors">
                                        {doc.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                                        {doc.description}
                                    </p>
                                </div>

                                <Divider className="my-4" style={{ borderColor: '#f0f0f0' }} />

                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                                        <ClockCircleOutlined /> Cập nhật: {doc.updatedAt}
                                    </span>
                                    <a href={doc.FileLink} target="_blank" rel="noreferrer" className="text-[#A31D1D] font-bold flex items-center gap-1 hover:underline">
                                        Tải về <DownloadOutlined className="text-[14px]" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 font-medium">
                        Không tìm thấy tài liệu nào trong thư mục này.
                    </div>
                )}

                {filteredDocs.length > 0 && (
                    <div className="flex justify-center mt-12">
                        <Pagination current={currentPage} onChange={setCurrentPage} total={filteredDocs.length} pageSize={12} showSizeChanger={false} />
                    </div>
                )}
            </div>
        </ConfigProvider>
    );
}