'use client';

import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Avatar, Modal, Input, message, Spin } from 'antd';
import {
    CalendarOutlined,
    ExclamationCircleOutlined,
    MessageOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckOutlined,
    CloseOutlined,
    ExclamationCircleOutlined as WarningIcon
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

export default function TeacherDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    // Phân loại data theo trạng thái
    const [guidedGroups, setGuidedGroups] = useState<any[]>([]);
    const [pendingTopics, setPendingTopics] = useState<any[]>([]);

    // Quản lý Tab ẩn/hiện bảng: 'guided' (Đang hướng dẫn) hoặc 'pending' (Chờ duyệt)
    const [activeTab, setActiveTab] = useState<'guided' | 'pending'>('guided');

    // State xử lý Modal Từ chối duyệt
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    // ================= 1. GỌI API LẤY DATA ĐỔ VÀO DASHBOARD =================
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Thêm api/huong-dan/ vào hàng đợi Promise để lấy lời mời giảng viên
            const [userRes, deTaiRes, huongDanRes] = await Promise.all([
                sendRequest<any>({ url: 'http://localhost:8000/api/me/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/de-tai/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/huong-dan/', method: 'GET' })
            ]);

            setUserData(userRes);

            // A. Đề tài đang hướng dẫn (Lấy từ api/de-tai/ như cũ)
            const topicsData = deTaiRes.results || deTaiRes || [];
            const guided = topicsData.filter((t: any) => t.TrangThai === 'DANGTHUCHIEN' || t.TrangThai === 'CHONGHIEMTHU');
            setGuidedGroups(guided);

            // B. Hồ sơ chờ xác nhận (Lấy từ api/huong-dan/ và làm phẳng dữ liệu)
            const invitationsData = huongDanRes.results || huongDanRes || [];
            const pendingFlatted = invitationsData.map((item: any) => ({
                MaHuongDan: item.MaHuongDan, // ID dùng để gọi lệnh duyệt/từ chối
                MaDeTai: item.de_tai_info?.MaDeTai,
                TenDeTai: item.de_tai_info?.TenDeTai,
                TrangThai: item.de_tai_info?.TrangThai,
                sinh_vien_nhom: item.de_tai_info?.chu_nhiem || 'Nhóm sinh viên KMA'
            }));
            setPendingTopics(pendingFlatted);

        } catch (error: any) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
            messageApi.error("Không thể kết nối dữ liệu hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // ================= 2. LOGIC HÀNH ĐỘNG: ĐỒNG Ý HƯỚNG DẪN =================
    const handleApprove = (record: any) => {
        Modal.confirm({
            title: 'Xác nhận phê duyệt hướng dẫn',
            icon: <WarningIcon className="text-green-500" />,
            content: `Thầy/Cô có chắc chắn muốn nhận hướng dẫn đề tài: "${record.TenDeTai}" không?`,
            okText: 'Xác nhận nhận',
            cancelText: 'Hủy bỏ',
            okButtonProps: { className: 'bg-green-600 border-none' },
            onOk: async () => {
                try {
                    // SỬA CHỖ NÀY: Gọi API /api/de-tai/.../xac-nhan/
                    await sendRequest({
                        url: `http://localhost:8000/api/de-tai/${record.MaDeTai}/xac-nhan/`,
                        method: 'PATCH'
                    });
                    messageApi.success('Đã xác nhận hướng dẫn đề tài! Đề tài chính thức kích hoạt.');
                    fetchDashboardData();
                } catch (error: any) {
                    messageApi.error(error.message || 'Xác nhận thất bại.');
                }
            }
        });
    };

    // ================= 3. LOGIC HÀNH ĐỘNG: TỪ CHỐI HƯỚNG DẪN =================
    const handleRejectSubmit = async () => {
        setIsSubmitting(true);
        try {
            // SỬA CHỖ NÀY: Gọi API /api/de-tai/.../tu-choi-gv/
            await sendRequest({
                url: `http://localhost:8000/api/de-tai/${selectedTopic.MaDeTai}/tu-choi-gv/`,
                method: 'PATCH'
            });
            messageApi.success('Đã từ chối nhận hướng dẫn đề tài này.');
            setIsRejectModalVisible(false);
            setRejectReason('');
            fetchDashboardData();
        } catch (error: any) {
            messageApi.error(error.message || 'Xử lý thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= 4. CẤU HÌNH CÁC CỘT DỰA THEO TAB HOẠT ĐỘNG =================
    const getColumns = () => {
        const baseColumns = [
            {
                title: 'MÃ ĐỀ TÀI',
                dataIndex: 'MaDeTai',
                key: 'MaDeTai',
                render: (text: string) => <span className="font-bold text-gray-800">{text}</span>,
            },
            {
                title: 'TÊN ĐỀ TÀI',
                dataIndex: 'TenDeTai',
                key: 'TenDeTai',
                width: '40%',
                render: (text: string) => <span className="text-gray-600 font-medium line-clamp-2 leading-snug">{text}</span>,
            },
            {
                title: 'TRƯỞNG NHÓM / SINH VIÊN',
                dataIndex: 'sinh_vien_nhom',
                key: 'sinh_vien_nhom',
                render: (text: string) => <span className="text-gray-600 text-sm font-medium">{text || 'Sinh viên KMA'}</span>,
            },
        ];

        if (activeTab === 'guided') {
            return [
                ...baseColumns,
                {
                    title: 'TIẾN ĐỘ',
                    dataIndex: 'TienDoChung',
                    key: 'TienDoChung',
                    render: (percent: number) => {
                        const currentPercent = percent || 0;
                        return (
                            <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#A31D1D] h-full rounded-full" style={{ width: `${currentPercent}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-[#A31D1D]">{currentPercent}%</span>
                            </div>
                        );
                    },
                },
                {
                    title: 'TRẠNG THÁI',
                    dataIndex: 'TrangThai_display',
                    key: 'TrangThai_display',
                    render: (text: string) => (
                        <Tag className="font-bold border-none px-2.5 py-1 text-[10px] bg-blue-50 text-blue-600 rounded">
                            {text || 'ĐANG THỰC HIỆN'}
                        </Tag>
                    ),
                },
            ];
        } else {
            return [
                ...baseColumns,
                {
                    title: 'XỬ LÝ LỜI MỜI',
                    key: 'action',
                    align: 'center' as const,
                    render: (_: any, record: any) => (
                        <div className="flex gap-2 justify-center">
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={() => handleApprove(record)}
                                className="bg-green-600 hover:bg-green-700 border-none text-[11px] font-bold h-7 rounded"
                            >
                                Đồng ý
                            </Button>
                            <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setSelectedTopic(record);
                                    setIsRejectModalVisible(true);
                                }}
                                className="text-[11px] font-bold h-7 rounded"
                            >
                                Từ chối
                            </Button>
                        </div>
                    )
                }
            ];
        }
    };

    const avgProgress = guidedGroups.length > 0
        ? Math.round(guidedGroups.reduce((acc, cur) => acc + (cur.TienDoChung || 0), 0) / guidedGroups.length)
        : 0;

    return (
        <div className="max-w-[1400px] mx-auto pb-10">
            {contextHolder}

            {/* ================= LỜI CHÀO HEADER ================= */}
            <div className="mb-8 border-b border-gray-200/60 pb-6">
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                    Chào buổi sáng, {userData?.TenHienThi || 'Giảng viên'}! 👋
                </h1>
                <p className="text-gray-500 text-sm">
                    Bạn đang quản lý hiệu quả hệ thống nghiên cứu khoa học. Hãy rà soát hồ sơ đề tài dưới đây.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32"><Spin size="large" /></div>
            ) : (
                /* ================= KHUNG LƯỚI CHÍNH ================= */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ================= CỘT TRÁI ================= */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* 1. THỐNG KÊ TỔNG QUAN */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-[10px] font-bold text-[#A31D1D] uppercase tracking-wider mb-1">Tổng quan hướng dẫn</h3>
                                    <h2 className="text-lg font-bold text-gray-800">Thống kê &amp; Tiến độ chung</h2>
                                </div>
                                <div className="bg-[#F6FFED] text-[#389E0D] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#389E0D]"></div>
                                    Hệ thống hoạt động tốt
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Đang hướng dẫn</p>
                                    <p className="text-3xl font-black text-gray-800">{guidedGroups.length}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Tiến độ trung bình</p>
                                    <p className="text-3xl font-black text-gray-800">{avgProgress}%</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Lời mời chờ xử lý</p>
                                    <p className="text-3xl font-black text-[#A31D1D]">{pendingTopics.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. TAB ĐIỀU HƯỚNG DANH SÁCH NHÓM & PHÊ DUYỆT */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setActiveTab('guided')}
                                        className={`text-sm font-bold pb-1 transition-all border-b-2 bg-transparent border-none cursor-pointer ${activeTab === 'guided'
                                            ? 'text-[#A31D1D] border-[#A31D1D]'
                                            : 'text-gray-400 border-transparent hover:text-gray-600'
                                            }`}
                                    >
                                        Đang hướng dẫn ({guidedGroups.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`text-sm font-bold pb-1 transition-all border-b-2 flex items-center gap-1.5 bg-transparent border-none cursor-pointer ${activeTab === 'pending'
                                            ? 'text-[#A31D1D] border-[#A31D1D]'
                                            : 'text-gray-400 border-transparent hover:text-gray-600'
                                            }`}
                                    >
                                        Lời mời hướng dẫn
                                        {pendingTopics.length > 0 && (
                                            <span className="bg-[#A31D1D] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                                {pendingTopics.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <a href="#" className="text-xs font-bold text-[#A31D1D] hover:underline">Xem chi tiết</a>
                            </div>

                            <Table
                                columns={getColumns()}
                                dataSource={activeTab === 'guided' ? guidedGroups : pendingTopics}
                                rowKey={(record) => record.MaDeTai || record.MaHuongDan}
                                pagination={{ pageSize: 5 }}
                                className="custom-table-header"
                                locale={{ emptyText: activeTab === 'guided' ? 'Chưa có nhóm nào đăng ký hướng dẫn.' : 'Tuyệt vời! Thầy/Cô không có yêu cầu nhận hướng dẫn nào đang chờ xử lý 🎉' }}
                            />
                        </div>

                        {/* 3. PHẢN HỒI MỚI NHẤT TỪ SINH VIÊN */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <MessageOutlined className="text-[#A31D1D]" /> Phản hồi mới nhất từ sinh viên
                                </h2>
                                <a href="#" className="text-xs font-bold text-[#A31D1D] hover:underline">Xem tất cả</a>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <Avatar size={40} icon={<UserOutlined />} className="bg-red-50 text-[#A31D1D]" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="font-bold text-gray-800 text-sm mr-2">Nhóm nghiên cứu KMA</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">Vừa xong</span>
                                        </div>
                                        <p className="text-sm italic text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            "Hệ thống tự động đồng bộ phản hồi tiến độ nghiên cứu của sinh viên tại đây..."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ================= CỘT PHẢI ================= */}
                    <div className="lg:col-span-1 flex flex-col gap-6">

                        {/* 1. LỊCH HỘI ĐỒNG SẮP TỚI */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <CalendarOutlined className="text-[#A31D1D]" /> Lịch hội đồng sắp tới
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex gap-4 items-center border border-gray-100 p-3 rounded-xl hover:border-red-200 transition-colors cursor-pointer">
                                    <div className="bg-[#A31D1D] text-white rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[9px] font-bold uppercase">TH6</span>
                                        <span className="text-lg font-black leading-none">22</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">Hội đồng nghiệm thu cấp Khoa</h4>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-0.5">
                                            <EnvironmentOutlined /> Phòng Hội thảo - Nhà TA
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <ClockCircleOutlined /> 08:30 - 11:30
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full text-[#A31D1D] font-bold text-xs border border-[#A31D1D] hover:bg-red-50 rounded-lg h-9">
                                Xem toàn bộ lịch trình
                            </Button>
                        </div>

                        {/* 2. ĐỀ TÀI CẦN XỬ LÝ GẤP */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <ExclamationCircleOutlined className="text-[#A31D1D]" /> Lời mời cần phản hồi ngay
                            </h2>

                            <div className="space-y-4 mb-6">
                                {pendingTopics.slice(0, 3).map((topic, i) => (
                                    <div key={topic.MaHuongDan || i} className="border border-gray-100 p-3.5 rounded-xl bg-orange-50/30 hover:border-orange-200 transition-colors cursor-pointer" onClick={() => setActiveTab('pending')}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 text-xs truncate max-w-[120px]">Mã đề tài: {topic.MaDeTai}</span>
                                            <span className="bg-[#A31D1D] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">MỜI HƯỚNG DẪN</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-gray-600 line-clamp-2 leading-relaxed">{topic.TenDeTai}</p>
                                    </div>
                                ))}
                                {pendingTopics.length === 0 && (
                                    <p className="text-xs text-gray-400 italic">Không có yêu cầu khẩn cấp nào.</p>
                                )}
                            </div>

                            <div className="text-center">
                                <button onClick={() => setActiveTab('pending')} className="text-xs font-bold text-[#A31D1D] hover:underline bg-transparent border-none cursor-pointer">
                                    Xử lý lời mời ({pendingTopics.length})
                                </button>
                            </div>
                        </div>

                        {/* 3. HỖ TRỢ KỸ THUẬT */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-5">Hỗ trợ kỹ thuật</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg text-gray-500 border border-gray-100">
                                        <MessageOutlined className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">nckh@actvn.edu.vn</div>
                                        <div className="text-[10px] text-gray-400 uppercase">Phòng Đào tạo &amp; NCKH</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN TỪ CHỐI HƯỚNG DẪN */}
            <Modal
                title={<span className="font-black text-lg text-[#A31D1D]">Từ chối phê duyệt hướng dẫn</span>}
                open={isRejectModalVisible}
                onCancel={() => {
                    setIsRejectModalVisible(false);
                    setRejectReason('');
                }}
                footer={[
                    <Button key="back" onClick={() => setIsRejectModalVisible(false)}>Hủy bỏ</Button>,
                    <Button key="submit" type="primary" danger loading={isSubmitting} onClick={handleRejectSubmit} className="font-bold">
                        Xác nhận từ chối
                    </Button>
                ]}
            >
                <div className="py-3">
                    <p className="text-xs text-gray-500 mb-3 font-medium">
                        ĐỀ TÀI: <span className="text-gray-800 font-bold">"{selectedTopic?.TenDeTai}"</span>
                    </p>
                    <p className="text-sm text-gray-600 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 font-medium">
                        ⚠️ Lưu ý: Khi Thầy/Cô từ chối, đề tài sẽ được chuyển trả về trạng thái lỗi để nhóm sinh viên thực hiện thay đổi Giảng viên hướng dẫn khác.
                    </p>
                </div>
            </Modal>
        </div>
    );
}


