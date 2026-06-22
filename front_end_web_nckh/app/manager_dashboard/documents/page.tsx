'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select, Table, Tag, Avatar, message, Modal, Tooltip, ConfigProvider, Spin } from 'antd';
import {
    FilterOutlined,
    FolderOpenOutlined,
    ExportOutlined,
    HourglassOutlined,
    DashboardOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

export default function ManagerProjectsPage() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [allProjects, setAllProjects] = useState<any[]>([]);

    // States cho bộ lọc
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [messageApi, contextHolder] = message.useMessage();

    // ================= 1. GỌI API LẤY TOÀN BỘ DỮ LIỆU ĐỀ TÀI =================
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
            messageApi.error("Không thể kết nối lấy dữ liệu hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagerData();
    }, []);

    // ================= 2. HÀM XỬ LÝ DUYỆT / TỪ CHỐI =================
    const handleAction = (id: string, actionPath: string, title: string) => {
        const isApprove = actionPath === 'duyet';
        Modal.confirm({
            title: `Xác nhận ${title} đề tài`,
            icon: <ExclamationCircleOutlined className={isApprove ? 'text-green-500' : 'text-red-500'} />,
            content: `Bạn có chắc chắn muốn ${title.toLowerCase()} đề tài này không?`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            okButtonProps: { className: isApprove ? 'bg-green-600 border-none' : 'bg-red-600 border-none' },
            onOk: async () => {
                try {
                    // GỌI THẲNG VÀO API TÙY CHỈNH MÀ CHÚNG TA ĐÃ VIẾT BÊN DJANGO
                    await sendRequest({
                        url: `http://localhost:8000/api/de-tai/${id}/${actionPath}/`,
                        method: 'PATCH'
                    });
                    messageApi.success(`Đã ${title.toLowerCase()} đề tài thành công!`);
                    fetchManagerData();
                } catch (error: any) {
                    messageApi.error('Xử lý thất bại: ' + error.message);
                }
            }
        });
    };

    // ================= 3. LỌC & TÍNH TOÁN DỮ LIỆU ĐỘNG =================
    const filteredProjects = allProjects.filter(p => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return p.TrangThai === 'CHODUYET';
        if (statusFilter === 'approved') return p.TrangThai !== 'CHODUYET' && p.TrangThai !== 'TUCHOI';
        return true;
    });

    const totalProjects = allProjects.length;
    const pendingProjects = allProjects.filter(p => p.TrangThai === 'CHODUYET').length;
    // Hiệu suất duyệt: Tính phần trăm số đề tài đã được xử lý (không còn ở trạng thái CHODUYET)
    const efficiency = totalProjects === 0 ? 0 : Math.round(((totalProjects - pendingProjects) / totalProjects) * 100);

    // ================= 4. CẤU HÌNH CỘT BẢNG ĐỘNG =================
    const columns = [
        {
            title: 'MÃ ĐỀ TÀI',
            dataIndex: 'MaDeTai',
            key: 'MaDeTai',
            render: (text: string) => <span className="font-black text-[#A31D1D]">{text}</span>,
        },
        {
            title: 'TÊN ĐỀ TÀI',
            key: 'name',
            width: '35%',
            render: (record: any) => (
                <div>
                    <div className="font-bold text-gray-800 text-sm mb-0.5 pr-4 leading-snug">{record.TenDeTai}</div>
                    <div className="text-[11px] text-gray-400">GVHD: {record.gv_huong_dan || 'Chưa phân công'}</div>
                </div>
            ),
        },
        {
            title: 'ĐẠI DIỆN NHÓM',
            key: 'leader',
            render: (record: any) => {
                const teamName = record.sinh_vien_nhom || 'Sinh viên KMA';
                // Tách 2 chữ cái đầu để làm Avatar
                const initials = teamName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase();

                return (
                    <div className="flex items-center gap-3">
                        <Avatar size="large" className="bg-gray-200 text-gray-600 font-bold shrink-0">
                            {initials}
                        </Avatar>
                        <div>
                            <div className="font-bold text-gray-800 text-sm">{teamName}</div>
                            <div className="text-[11px] text-gray-400">Học viện Kỹ thuật Mật mã</div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'NGÀY TẠO',
            key: 'date',
            render: (record: any) => (
                <span className="text-gray-600 font-medium text-sm">
                    {record.NgayTao ? new Date(record.NgayTao).toLocaleDateString('vi-VN') : '---'}
                </span>
            ),
        },
        {
            title: 'TRẠNG THÁI',
            dataIndex: 'TrangThai',
            key: 'TrangThai',
            render: (status: string, record: any) => {
                const isPending = status === 'CHODUYET';
                const isRejected = status === 'TUCHOI' || status === 'DAHUY';
                return (
                    <Tag className={`font-bold border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-wider 
                        ${isPending ? 'bg-orange-50 text-orange-600' :
                            isRejected ? 'bg-red-50 text-red-600' :
                                'bg-green-50 text-green-600'}`}
                    >
                        {record.TrangThai_display || status}
                    </Tag>
                );
            },
        },
        {
            title: 'THAO TÁC',
            key: 'action',
            align: 'center' as const,
            render: (record: any) => (
                <div className="flex items-center justify-center gap-4 text-lg">
                    <Tooltip title="Xem chi tiết hồ sơ">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#A31D1D] hover:bg-red-50 transition-colors mx-auto">
                            <EyeOutlined className="text-lg" />
                        </button>
                    </Tooltip>

                    {/* ĐÃ SỬA: Khoa chỉ duyệt những đơn đang ở trạng thái CHODUYET */}
                    {record.TrangThai === 'CHODUYET' && (
                        <>
                            <Tooltip title="Chuyển cho Giảng viên">
                                <CheckCircleOutlined
                                    className="text-green-600 cursor-pointer hover:opacity-70 transition-opacity"
                                    // ĐÃ SỬA: Đẩy trạng thái sang CHODUYET_GV
                                    onClick={() => handleAction(record.MaDeTai, 'duyet', 'Phê duyệt')}
                                />
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <CloseCircleOutlined
                                    className="text-red-500 cursor-pointer hover:opacity-70 transition-opacity"
                                    // ĐÃ SỬA: Nếu khoa từ chối thì đánh trượt luôn
                                    onClick={() => handleAction(record.MaDeTai, 'tu-choi', 'Từ chối')}
                                />
                            </Tooltip>
                        </>
                    )}
                </div>
            ),
        }
    ];

    if (loading) return <div className="p-8"><Spin size="large" className="block mx-auto mt-20" /></div>;

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">
                {contextHolder}

                {/* ================= HEADER & ACTIONS ================= */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Quản lý Đề tài khoa học</h1>
                        <p className="text-gray-500 text-sm">
                            Có <span className="font-bold text-[#A31D1D]">{pendingProjects} đơn đăng ký</span> cần xét duyệt trên hệ thống.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filter Trạng thái */}
                        <div className="bg-white border border-gray-200 rounded-lg h-10 flex items-center px-3 gap-2 shadow-sm cursor-pointer hover:border-[#A31D1D] transition-colors">
                            <FilterOutlined className="text-[#A31D1D]" />
                            <Select
                                value={statusFilter}
                                onChange={setStatusFilter}
                                bordered={false}
                                className="w-40 font-medium text-gray-700"
                                dropdownStyle={{ borderRadius: '8px' }}
                            >
                                <Select.Option value="all">Tất cả trạng thái</Select.Option>
                                <Select.Option value="pending">Đang chờ duyệt</Select.Option>
                                <Select.Option value="approved">Đã phê duyệt</Select.Option>
                            </Select>
                        </div>

                        {/* Export Button */}
                        <Button
                            type="primary"
                            icon={<ExportOutlined />}
                            className="font-bold bg-[#8B1515] border-none h-10 px-5 rounded-lg shadow-sm hover:opacity-90"
                            onClick={() => messageApi.success('Tính năng xuất Excel đang được xây dựng!')}
                        >
                            Xuất báo cáo
                        </Button>
                    </div>
                </div>

                {/* ================= 3 STATS CARDS ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center transition-all hover:shadow-md border-l-4 border-l-gray-400">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tổng đề tài</div>
                            <div className="text-3xl font-black text-gray-800 leading-none">{totalProjects}</div>
                        </div>
                        <div className="bg-gray-50 p-3.5 rounded-2xl text-gray-500 text-2xl">
                            <FolderOpenOutlined />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center transition-all hover:shadow-md border-l-4 border-l-[#A31D1D]">
                        <div>
                            <div className="text-[10px] font-bold text-[#A31D1D] uppercase tracking-wider mb-2">Đang chờ duyệt</div>
                            <div className="text-3xl font-black text-[#A31D1D] leading-none">{pendingProjects}</div>
                        </div>
                        <div className="bg-red-50 p-3.5 rounded-2xl text-[#A31D1D] text-2xl">
                            <HourglassOutlined />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center transition-all hover:shadow-md border-l-4 border-l-green-500">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hiệu suất duyệt</div>
                            <div className="text-3xl font-black text-gray-800 leading-none">{efficiency}%</div>
                        </div>
                        <div className="bg-green-50 p-3.5 rounded-2xl text-green-600 text-2xl">
                            <DashboardOutlined />
                        </div>
                    </div>
                </div>

                {/* ================= DATA TABLE ================= */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <Table
                        columns={columns}
                        dataSource={filteredProjects}
                        rowKey="MaDeTai"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total, range) => <span className="font-medium text-gray-500 px-4">Đang hiển thị {range[0]}-{range[1]} trên tổng số {total} hồ sơ</span>,
                            className: "px-5 py-4 m-0 border-t border-gray-100 bg-gray-50/50"
                        }}
                        className="custom-table-header"
                        rowClassName="hover:bg-gray-50/50 transition-colors"
                        locale={{ emptyText: 'Chưa có dữ liệu đề tài nào.' }}
                    />
                </div>

            </div>
        </ConfigProvider>
    );
}