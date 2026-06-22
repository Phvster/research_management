'use client';

import React, { useState, useEffect } from 'react';
import { Progress, Skeleton, message, Tooltip, Input, ConfigProvider } from 'antd';
import {
    EyeOutlined,
    ArrowRightOutlined,
    ReadOutlined,
    TeamOutlined,
    FileDoneOutlined,
    WarningOutlined,
    DatabaseOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

export default function ManagerDashboard() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    // ================= 1. GỌI API LẤY TOÀN BỘ DỮ LIỆU HỆ THỐNG =================
    const fetchManagerData = async () => {
        setLoading(true);
        try {
            const [userRes, deTaiRes] = await Promise.all([
                sendRequest<any>({ url: 'http://localhost:8000/api/me/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/de-tai/', method: 'GET' })
            ]);

            setUserData(userRes);
            const projectsData = deTaiRes.results || deTaiRes || [];
            setAllProjects(projectsData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu Quản lý:", error);
            messageApi.error("Không thể kết nối để lấy dữ liệu tổng hợp.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagerData();
    }, []);

    // ================= 2. TÍNH TOÁN THỐNG KÊ ĐỘNG =================
    const totalProjects = allProjects.length;
    const pendingProjects = allProjects.filter(p => p.TrangThai === 'CHODUYET').length;
    const activeProjects = allProjects.filter(p => p.TrangThai === 'DANGTHUCHIEN').length;
    const canceledProjects = allProjects.filter(p => p.TrangThai === 'TUCHOI' || p.TrangThai === 'DAHUY').length;

    // ================= 3. LỌC TÌM KIẾM ĐỀ TÀI =================
    const filteredProjects = allProjects.filter(p =>
        (p.TenDeTai || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (p.MaDeTai || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (p.gv_huong_dan || '').toLowerCase().includes(searchText.toLowerCase())
    );

    // ================= 4. MAP MÀU SẮC TRẠNG THÁI =================
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CHODUYET': return 'bg-yellow-100 text-yellow-700';
            case 'DANGTHUCHIEN': return 'bg-blue-100 text-blue-700';
            case 'CHONGHIEMTHU':
            case 'DANGHIEMTHU': return 'bg-green-100 text-green-700';
            case 'TUCHOI':
            case 'DAHUY': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <div className="p-8 max-w-[1400px] mx-auto"><Skeleton active paragraph={{ rows: 12 }} /></div>;

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10">
                {contextHolder}

                {/* 1. Header Lời chào */}
                <div className="border-b border-gray-200/60 pb-6 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                        Chào buổi sáng, {userData?.TenHienThi || 'Quản lý'}! <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Hệ thống đang hoạt động ổn định. Bạn có <span className="font-semibold text-[#A31D1D]">{pendingProjects} nhiệm vụ phê duyệt mới</span> cần xử lý trong hôm nay.
                    </p>
                </div>

                {/* 2. Các thẻ Thống kê (Grid 4 cột) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-[#A31D1D] relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <ReadOutlined className="text-2xl text-[#A31D1D]" />
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md uppercase tracking-wider">Tổng cộng</span>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Tổng số đề tài NCKH</div>
                        <div className="text-2xl font-bold text-[#A31D1D]">{totalProjects}</div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-[#8B7D3A] relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <TeamOutlined className="text-2xl text-[#8B7D3A]" />
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">Đang chạy</span>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Đề tài đang thực hiện</div>
                        <div className="text-2xl font-bold text-[#8B7D3A]">{activeProjects}</div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-red-400 relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <FileDoneOutlined className="text-2xl text-red-400" />
                            {pendingProjects > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-1 rounded-md uppercase tracking-wider animate-pulse">Cần xử lý gấp</span>}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Đề tài chờ phê duyệt</div>
                        <div className="text-2xl font-bold text-red-500">{pendingProjects}</div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm border-l-4 border-l-gray-500 relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <WarningOutlined className="text-2xl text-gray-500" />
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Đề tài bị hủy / Từ chối</div>
                        <div className="text-2xl font-bold text-gray-600">{canceledProjects}</div>
                    </div>
                </div>

                {/* 3. Phần Nội dung chính (Grid 2 cột lệch: 2/3 và 1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CỘT TRÁI: Bảng Đề tài (Chiếm 2 phần) */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Danh mục Đề tài NCKH</h2>
                                <p className="text-xs text-gray-500 mt-1">Quản lý và giám sát trạng thái của toàn bộ dự án.</p>
                            </div>
                            <Input
                                prefix={<SearchOutlined className="text-gray-400" />}
                                placeholder="Tìm kiếm theo mã, tên đề tài..."
                                allowClear
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full sm:w-[250px] rounded-lg"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white text-gray-500 text-[11px] uppercase tracking-widest font-bold border-b border-gray-200">
                                        <th className="px-5 py-4">Mã đề tài</th>
                                        <th className="px-5 py-4 w-2/5">Tên đề tài</th>
                                        <th className="px-5 py-4">Chủ nhiệm</th>
                                        <th className="px-5 py-4 text-center">Trạng thái</th>
                                        <th className="px-5 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-700">
                                    {filteredProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-gray-400 italic">
                                                Không tìm thấy đề tài nào khớp với điều kiện tìm kiếm.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProjects.slice(0, 8).map((topic) => (
                                            <tr key={topic.MaDeTai} className="hover:bg-red-50/30 transition-colors border-b border-gray-100 last:border-none">
                                                <td className="px-5 py-4 font-mono text-xs font-bold text-[#A31D1D]">{topic.MaDeTai}</td>
                                                <td className="px-5 py-4 font-semibold text-gray-800">
                                                    <div className="line-clamp-2" title={topic.TenDeTai}>{topic.TenDeTai}</div>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-medium text-gray-600">{topic.gv_huong_dan || 'N/A'}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(topic.TrangThai)}`}>
                                                        {topic.TrangThai_display || topic.TrangThai}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <Tooltip title="Xem chi tiết hồ sơ">
                                                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#A31D1D] hover:bg-red-50 transition-colors mx-auto">
                                                            <EyeOutlined className="text-lg" />
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {filteredProjects.length > 8 && (
                                <div className="p-4 border-t border-gray-100 text-center bg-gray-50/30">
                                    <button className="text-[#A31D1D] text-xs font-bold uppercase tracking-wider hover:underline flex items-center justify-center gap-1.5 w-full">
                                        Xem toàn bộ danh sách ({filteredProjects.length} đề tài) <ArrowRightOutlined />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: Trạng thái & Tin tức (Chiếm 1 phần) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* Box Trạng thái hệ thống */}
                        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                            <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <DatabaseOutlined className="text-[#A31D1D]" /> Trạng thái Server (KMA)
                            </h2>

                            <div className="mb-6">
                                <div className="flex justify-between items-center text-xs font-bold mb-1">
                                    <span className="text-gray-500 uppercase tracking-wider">Tải dung lượng</span>
                                    <span className="text-[#A31D1D]">85%</span>
                                </div>
                                <Progress percent={85} showInfo={false} strokeColor="#A31D1D" trailColor="#f0f0f0" className="m-0" />
                            </div>

                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-gray-500 font-medium">Băng thông mạng</span>
                                <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Ổn định</span>
                            </div>
                            <div className="flex gap-1 mb-6">
                                <div className="h-1.5 flex-1 bg-green-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-green-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-green-500 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-gray-200 rounded-full"></div>
                            </div>

                            <ul className="flex flex-col gap-3 text-sm text-gray-600 font-medium">
                                <li className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                    Database Core: <span className="text-gray-800 ml-auto text-xs">Bình thường</span>
                                </li>
                                <li className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                    API Gateway: <span className="text-gray-800 ml-auto text-xs">Đã kết nối</span>
                                </li>
                                <li className="flex items-center gap-2.5 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
                                    Hệ thống Backup: <span className="text-yellow-700 ml-auto text-xs font-bold">Đang chạy (60%)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Box Tin nổi bật */}
                        <div
                            className="rounded-xl overflow-hidden relative h-[200px] group cursor-pointer border border-transparent hover:border-[#A31D1D] transition-all shadow-sm"
                            style={{
                                backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-[#6e1414] via-[#851818]/70 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 p-5 w-full">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">THÔNG BÁO</span>
                                <h3 className="text-white text-lg font-bold leading-snug drop-shadow-md group-hover:-translate-y-1 transition-transform">Kế hoạch triển khai Nghiên cứu Khoa học năm 2024</h3>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </ConfigProvider>
    );
}