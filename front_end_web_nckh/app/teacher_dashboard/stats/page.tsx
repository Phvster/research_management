'use client';

import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Avatar, Select, Modal, Form, Input, InputNumber, Spin, message, Tooltip } from 'antd';
import {
    FilterOutlined,
    DownloadOutlined,
    FolderOutlined,
    FileExclamationOutlined,
    LineChartOutlined,
    SafetyCertificateOutlined,
    MessageOutlined,
    FormOutlined,
    ArrowRightOutlined,
    BellOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';
import dayjs from 'dayjs';

export default function ProgressAndGradingPage() {
    const [loading, setLoading] = useState(true);
    const [progressList, setProgressList] = useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    // States cho Modal Chấm điểm
    const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
    const [selectedProgress, setSelectedProgress] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();

    // ================= 1. FETCH DATA TIẾN ĐỘ =================
    const fetchProgressData = async () => {
        setLoading(true);
        try {
            // Lấy danh sách tiến độ (Backend đã tự động lọc chỉ hiển thị nhóm do GV này hướng dẫn)
            const res = await sendRequest<any>({ url: 'http://localhost:8000/api/tien-do/', method: 'GET' });
            setProgressList(res.results || res || []);
        } catch (error) {
            console.error("Lỗi tải tiến độ:", error);
            messageApi.error("Không thể tải danh sách báo cáo tiến độ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgressData();
    }, []);

    // ================= 2. HÀM CHẤM ĐIỂM / NHẬN XÉT =================
    const openGradeModal = (record: any) => {
        setSelectedProgress(record);
        // Load lại dữ liệu cũ vào form nếu GV đã từng chấm và muốn sửa lại
        form.setFieldsValue({
            DiemGVHD: record.DiemGVHD,
            NhanXetGVHD: record.NhanXetGVHD
        });
        setIsGradeModalVisible(true);
    };

    const handleGradeSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            await sendRequest({
                url: `http://localhost:8000/api/tien-do/${selectedProgress.MaTienDo}/nhan-xet/`,
                method: 'PATCH',
                body: {
                    DiemGVHD: values.DiemGVHD,
                    NhanXetGVHD: values.NhanXetGVHD
                }
            });
            messageApi.success('Đã lưu nhận xét và điểm tiến độ thành công!');
            setIsGradeModalVisible(false);
            fetchProgressData(); // Cập nhật lại UI
        } catch (error: any) {
            messageApi.error(error.message || 'Có lỗi xảy ra khi lưu nhận xét.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= 3. CẤU HÌNH CỘT CHO TABLE =================
    const columns = [
        {
            title: 'ĐỀ TÀI NGHIÊN CỨU',
            dataIndex: 'de_tai_info',
            key: 'de_tai_info',
            width: '35%',
            render: (info: any, record: any) => (
                <div>
                    <div className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{info?.TenDeTai || 'Chưa cập nhật'}</div>
                    <div className="text-[10px] text-gray-500 uppercase flex items-center gap-2">
                        <Tag color="blue" bordered={false} className="m-0 text-[9px]">MÃ: {info?.MaDeTai}</Tag>
                        <ClockCircleOutlined /> Nộp: {dayjs(record.NgayCapNhat).format('HH:mm DD/MM/YYYY')}
                    </div>
                </div>
            ),
        },
        {
            title: 'TIẾN ĐỘ SV BÁO CÁO',
            dataIndex: 'TyLeHoanThanh',
            key: 'TyLeHoanThanh',
            width: '20%',
            render: (percent: number) => {
                const safePercent = percent || 0;
                return (
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-8 ${safePercent >= 90 ? 'text-green-600' : safePercent >= 50 ? 'text-[#A31D1D]' : 'text-gray-500'}`}>
                            {safePercent}%
                        </span>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`${safePercent >= 90 ? 'bg-green-500' : safePercent >= 50 ? 'bg-[#A31D1D]' : 'bg-gray-400'} h-full rounded-full`} style={{ width: `${safePercent}%` }}></div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'TÌNH TRẠNG CHẤM',
            key: 'status',
            width: '20%',
            render: (_: any, record: any) => {
                const isGraded = !!record.NhanXetGVHD;
                return isGraded ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" className="font-bold border-none bg-green-50 text-green-600 rounded px-2 py-1">
                        Đã nhận xét ({record.DiemGVHD || 0}đ)
                    </Tag>
                ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning" className="font-bold border-none bg-orange-50 text-orange-600 rounded px-2 py-1">
                        Chờ phản hồi
                    </Tag>
                );
            },
        },
        {
            title: 'THAO TÁC',
            key: 'action',
            align: 'center' as const,
            width: '15%',
            render: (_: any, record: any) => (
                <div className="flex items-center justify-center gap-2">
                    <Tooltip title="Xem & Chấm điểm">
                        <Button
                            type="primary"
                            icon={<FormOutlined />}
                            onClick={() => openGradeModal(record)}
                            className="bg-[#A31D1D] hover:bg-red-800 border-none font-bold text-xs"
                        >
                            Chấm bài
                        </Button>
                    </Tooltip>
                </div>
            ),
        },
    ];

    // Thống kê động
    const totalReports = progressList.length;
    const needReviewCount = progressList.filter(p => !p.NhanXetGVHD).length;
    const completedCount = progressList.filter(p => !!p.NhanXetGVHD).length;
    const avgProgress = totalReports > 0
        ? Math.round(progressList.reduce((acc, curr) => acc + curr.TyLeHoanThanh, 0) / totalReports)
        : 0;

    return (
        <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">
            {contextHolder}

            {/* ================= HEADER ================= */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">Theo dõi Tiến độ & Chấm điểm</h1>
                    <p className="text-gray-500 text-sm">
                        Bạn có <span className="font-bold text-[#A31D1D]">{needReviewCount} báo cáo</span> cần phản hồi trong tuần này.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button icon={<FilterOutlined />} className="font-semibold text-gray-600 h-10 px-4 rounded-lg">Lọc dữ liệu</Button>
                    <Button type="primary" icon={<DownloadOutlined />} className="font-semibold bg-[#A31D1D] border-none h-10 px-4 rounded-lg shadow-sm">
                        Xuất báo cáo (Excel)
                    </Button>
                </div>
            </div>

            {/* ================= STATS CARDS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm h-[100px]">
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-500 text-xl"><FolderOutlined /></div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng lượt báo cáo</div>
                        <div className="text-2xl font-black text-gray-800 leading-none">{totalReports}</div>
                    </div>
                </div>

                <div className={`bg-white p-5 rounded-xl border-t-2 border-b-2 border-l border-r border-gray-100 flex items-center gap-4 shadow-md h-[100px] ${needReviewCount > 0 ? 'border-t-[#A31D1D] border-b-[#A31D1D]' : ''}`}>
                    <div className="bg-red-50 p-3 rounded-lg text-[#A31D1D] text-xl relative">
                        <FileExclamationOutlined />
                        {needReviewCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-[#A31D1D] uppercase tracking-wider mb-1">Cần nhận xét gấp</div>
                        <div className="text-2xl font-black text-[#A31D1D] leading-none">{needReviewCount}</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm h-[100px]">
                    <div className="bg-green-50 p-3 rounded-lg text-green-500 text-xl"><LineChartOutlined /></div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tiến độ nhóm (TB)</div>
                        <div className="text-2xl font-black text-gray-800 leading-none">{avgProgress}%</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm h-[100px]">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-500 text-xl"><SafetyCertificateOutlined /></div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Đã chấm xong</div>
                        <div className="text-2xl font-black text-gray-800 leading-none">{completedCount}</div>
                    </div>
                </div>
            </div>

            {/* ================= MAIN TABLE ================= */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Danh sách Báo cáo tiến độ</h2>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><Spin /></div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={progressList}
                        rowKey="MaTienDo"
                        pagination={{ pageSize: 5 }}
                        className="custom-table-header"
                        locale={{ emptyText: 'Chưa có nhóm sinh viên nào nộp báo cáo tiến độ.' }}
                    />
                )}
            </div>

            {/* ================= MODAL CHẤM ĐIỂM & NHẬN XÉT ================= */}
            <Modal
                title={<span className="font-black text-lg text-[#A31D1D]">Đánh giá Báo cáo Tiến độ</span>}
                open={isGradeModalVisible}
                onCancel={() => { setIsGradeModalVisible(false); form.resetFields(); }}
                footer={null}
                width={700}
                centered
            >
                {/* Khu vực xem thông tin do sinh viên gửi */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <div className="mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Đề tài</span>
                        <p className="font-bold text-gray-800 m-0">{selectedProgress?.de_tai_info?.TenDeTai}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tiến độ sinh viên báo cáo</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-lg text-[#A31D1D]">{selectedProgress?.TyLeHoanThanh}%</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">File minh chứng đính kèm</span>
                            {selectedProgress?.FileMinhChung ? (
                                <a
                                    href={selectedProgress.FileMinhChung}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 bg-red-50 text-[#A31D1D] px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors"
                                >
                                    <FilePdfOutlined /> Tải/Xem File
                                </a>
                            ) : (
                                <span className="text-xs text-gray-500 italic">Không có file đính kèm</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Khu vực Giảng viên nhập liệu */}
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FormOutlined className="text-[#A31D1D]" /> Thầy/Cô Nhận xét & Chấm điểm
                </h3>

                <Form form={form} layout="vertical" onFinish={handleGradeSubmit}>
                    <Form.Item
                        label={<span className="font-bold text-sm text-gray-700">Điểm tiến độ (Hệ số 10)</span>}
                        name="DiemGVHD"
                        rules={[
                            { required: true, message: 'Vui lòng nhập điểm!' },
                            { type: 'number', min: 0, max: 10, message: 'Điểm từ 0 đến 10' }
                        ]}
                    >
                        <InputNumber placeholder="VD: 8.5" className="w-full rounded-lg" step={0.5} />
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-bold text-sm text-gray-700">Nội dung nhận xét cho Sinh viên</span>}
                        name="NhanXetGVHD"
                        rules={[{ required: true, message: 'Vui lòng nhập lời nhận xét!' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Nhập góp ý, yêu cầu chỉnh sửa hoặc đánh giá về báo cáo này để sinh viên nắm được..."
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                        <Button onClick={() => { setIsGradeModalVisible(false); form.resetFields(); }}>Hủy bỏ</Button>
                        <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-[#A31D1D] font-bold border-none px-6">
                            Lưu đánh giá
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Bottom Widgets (Giữ nguyên cấu trúc giao diện đẹp của bạn, tĩnh tạm thời) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Component nhận xét gần đây */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide text-sm">
                                <MessageOutlined className="text-[#A31D1D]" /> Mẫu nhận xét nhanh
                            </h3>
                        </div>
                        <div className="border-l-4 border-[#A31D1D] pl-4 py-1 relative z-10">
                            <p className="text-sm text-gray-600 italic leading-relaxed">
                                "Nhóm đã hoàn thành tốt các mục tiêu nghiên cứu trong giai đoạn này. Tuy nhiên cần chú trọng hơn vào phần thực nghiệm và so sánh kết quả. Yêu cầu đẩy nhanh tiến độ code."
                            </p>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">Hỗ trợ nghiệp vụ</h3>
                            <BellOutlined className="text-[#A31D1D]" />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            Giảng viên vui lòng phản hồi báo cáo của sinh viên trong vòng <strong className="text-gray-800">48 giờ</strong> kể từ khi hệ thống ghi nhận trạng thái nộp bài.
                        </p>
                        <Button className="w-full text-[#A31D1D] font-bold text-xs uppercase border-gray-200 hover:border-[#A31D1D]">
                            Xem hướng dẫn chi tiết
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}

