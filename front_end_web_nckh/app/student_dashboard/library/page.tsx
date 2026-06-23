'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Pagination, Divider, Spin, message, ConfigProvider, Empty, Tag } from 'antd';
import {
    FilePdfFilled,
    FileWordFilled,
    BookFilled,
    DownloadOutlined,
    ClockCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

// ── Khớp chính xác với field backend trả về ──────────────────────────────────
interface TaiLieuItem {
    MaTaiLieu: number;
    TenTaiLieu: string;
    MoTa: string;
    Loai: 'Biểu mẫu' | 'Quy định' | 'Hướng dẫn';
    DinhDang: 'Word' | 'PDF';
    DuongLink: string | null;
    FileDinhKem: string | null;  // URL tuyệt đối từ Django media
    NgayTao: string;
    NgayTao_display: string;
}

const FILTER_OPTIONS = ['Tất cả', 'Biểu mẫu', 'Quy định', 'Hướng dẫn'] as const;
const PAGE_SIZE = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDownloadUrl(doc: TaiLieuItem): string | null {
    return doc.DuongLink || doc.FileDinhKem || null;
}

function renderFileIcon(dinhDang: string) {
    if (dinhDang === 'PDF')
        return <FilePdfFilled className="text-3xl" style={{ color: '#ff4d4f' }} />;
    if (dinhDang === 'Word')
        return <FileWordFilled className="text-3xl" style={{ color: '#1677ff' }} />;
    return <BookFilled className="text-3xl" style={{ color: '#52c41a' }} />;
}

function getCategoryStyle(loai: string) {
    switch (loai) {
        case 'Quy định': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
        case 'Biểu mẫu': return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' };
        case 'Hướng dẫn': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
        default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    }
}

// ── Component chính ───────────────────────────────────────────────────────────
export default function LibraryPage() {
    const [documents, setDocuments] = useState<TaiLieuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [messageApi, contextHolder] = message.useMessage();

    // ── Fetch data ────────────────────────────────────────────────────────────
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await sendRequest<any>({
                url: 'http://localhost:8000/api/tai-lieu/',
                method: 'GET',
            });
            // API trả về dạng paginated { count, results } hoặc mảng thẳng
            const raw: TaiLieuItem[] = res?.results ?? res ?? [];
            setDocuments(raw);
        } catch {
            messageApi.error('Không thể tải danh mục tài liệu. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    // ── Lọc + tìm kiếm ───────────────────────────────────────────────────────
    const filteredDocs = documents.filter(doc => {
        const matchCategory = activeFilter === 'Tất cả' || doc.Loai === activeFilter;
        const matchSearch = searchText === ''
            || doc.TenTaiLieu.toLowerCase().includes(searchText.toLowerCase())
            || doc.MoTa.toLowerCase().includes(searchText.toLowerCase());
        return matchCategory && matchSearch;
    });

    // Reset về trang 1 khi đổi filter hoặc search
    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    // Phân trang client-side (dữ liệu đã load hết)
    const pagedDocs = filteredDocs.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Spin size="large" tip="Đang tải tài liệu..." />
            </div>
        );
    }

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-12">
                {contextHolder}

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <div className="mb-8 pb-6 border-b border-red-100">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
                        Thư viện tài liệu
                    </h1>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                        Tổng hợp biểu mẫu, quy định và hướng dẫn phục vụ hoạt động nghiên cứu khoa học
                        sinh viên tại Học viện.
                    </p>
                </div>

                {/* ── BỘ LỌC + TÌM KIẾM ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    {/* Filter pills */}
                    <div className="flex flex-wrap gap-2">
                        {FILTER_OPTIONS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => handleFilterChange(filter)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeFilter === filter
                                        ? 'bg-[#A31D1D] text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {filter}
                                {filter !== 'Tất cả' && (
                                    <span className="ml-1.5 text-xs opacity-70">
                                        ({documents.filter(d => d.Loai === filter).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search box */}
                    <div className="relative w-full sm:w-64">
                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Tìm tài liệu..."
                            value={searchText}
                            onChange={handleSearch}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#A31D1D] focus:ring-1 focus:ring-[#A31D1D]/20 transition-all"
                        />
                    </div>
                </div>

                {/* ── LƯỚI TÀI LIỆU ──────────────────────────────────────── */}
                {pagedDocs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
                        {pagedDocs.map(doc => {
                            const style = getCategoryStyle(doc.Loai);
                            const downloadUrl = getDownloadUrl(doc);

                            return (
                                <div
                                    key={doc.MaTaiLieu}
                                    className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-250 flex flex-col p-5 group"
                                >
                                    {/* Icon + Badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                            {renderFileIcon(doc.DinhDang)}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                                            {doc.Loai}
                                        </span>
                                    </div>

                                    {/* Nội dung */}
                                    <div className="flex-1 min-h-0">
                                        <h3 className="text-sm font-bold text-gray-800 mb-1.5 leading-snug line-clamp-2 group-hover:text-[#A31D1D] transition-colors">
                                            {doc.TenTaiLieu}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                                            {doc.MoTa || 'Không có mô tả.'}
                                        </p>
                                    </div>

                                    <Divider className="my-3" style={{ borderColor: '#f0f0f0', margin: '12px 0' }} />

                                    {/* Footer */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 flex items-center gap-1 font-medium truncate max-w-[60%]">
                                            <ClockCircleOutlined className="shrink-0" />
                                            {doc.NgayTao_display}
                                        </span>

                                        {downloadUrl ? (
                                            <a
                                                href={downloadUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#A31D1D] font-bold flex items-center gap-1 hover:underline shrink-0"
                                            >
                                                Tải về <DownloadOutlined />
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 text-xs italic">Chưa có file</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-24">
                        <Empty
                            description={
                                <span className="text-gray-400 font-medium">
                                    {searchText
                                        ? `Không tìm thấy tài liệu nào khớp với "${searchText}"`
                                        : 'Chưa có tài liệu trong danh mục này.'}
                                </span>
                            }
                        />
                    </div>
                )}

                {/* ── PHÂN TRANG ─────────────────────────────────────────── */}
                {filteredDocs.length > PAGE_SIZE && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                            current={currentPage}
                            onChange={setCurrentPage}
                            total={filteredDocs.length}
                            pageSize={PAGE_SIZE}
                            showSizeChanger={false}
                            showTotal={(total) => `${total} tài liệu`}
                        />
                    </div>
                )}
            </div>
        </ConfigProvider>
    );
}
