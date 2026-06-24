'use client';


import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Card, Progress, Modal, Tooltip, message, Typography, Badge, Empty, Popover, Avatar } from 'antd';
import {
    CheckCircleOutlined,
    SyncOutlined,
    FileTextOutlined,
    UserOutlined,
    CalculatorOutlined,
    EyeOutlined,
    ExclamationCircleOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';
import dayjs from 'dayjs';


const { Text, Paragraph } = Typography;


export default function ManagerEvaluationControl() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [detailedScores, setDetailedScores] = useState<{ [key: string]: any[] }>({});
    const [loadingDetails, setLoadingDetails] = useState<{ [key: string]: boolean }>({});
    const [messageApi, contextHolder] = message.useMessage();


    // ================= 1. FETCH DANH SÁCH BÁO CÁO CHỜ NGHIỆM THU =================
    const fetchReportsData = async () => {
        setDetailedScores({});
        setLoading(true);
        try {
            // Lấy toàn bộ báo cáo của các đề tài đang ở trạng thái CHONGHIEMTHU
            const res = await sendRequest<any>({
                url: 'http://localhost:8000/api/bao-cao/?ordering=-NgayNop',
                method: 'GET'
            });
            const list = res.results || res || [];
            // Lọc các đề tài thực sự ở trạng thái chờ nghiệm thu hoặc đã nghiệm thu
            setReports(list);
            list.forEach((item: any) => { if (item.MaDeTai) fetchProjectScores(item.MaDeTai); });
        } catch (error) {
            console.error(error);
            messageApi.error("Không thể kết nối danh sách báo cáo nghiệm thu.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchReportsData();
    }, []);


    // ================= 2. FETCH CHI TIẾT 5 PHIẾU CHẤM CỦA HỘI ĐỒNG =================
    const fetchProjectScores = async (maDeTai: string) => {
        if (detailedScores[maDeTai]) return; // Đã có data thì không fetch lại


        setLoadingDetails(prev => ({ ...prev, [maDeTai]: true }));
        try {
            const res = await sendRequest<any>({
                url: `http://localhost:8000/api/danh-gia/?MaDeTai=${maDeTai}`,
                method: 'GET'
            });
            const scores = res.results || res || [];
            setDetailedScores(prev => ({ ...prev, [maDeTai]: scores }));
        } catch (error) {
            messageApi.error("Không thể tải chi tiết phiếu điểm của hội đồng.");
        } finally {
            setLoadingDetails(prev => ({ ...prev, [maDeTai]: false }));
        }
    };


    // ================= 3. LOGIC TỔNG HỢP ĐIỂM (GỌI ENDPOINT CHOT-NGHIEM-THU) =================
    const handleFinalizeScore = (maBaoCao: string, tenDeTai: string, soPhieu: number) => {
        if (soPhieu < 5) {
            return messageApi.warning("Hội đồng chưa chấm đủ 5 phiếu điểm độc lập. Không thể tổng hợp!");
        }


        Modal.confirm({
            title: <span className="text-[#A31D1D] font-black text-lg">Xác nhận Tổng hợp &amp; Công bố điểm</span>,
            icon: <CalculatorOutlined className="text-[#A31D1D]" />,
            content: (
                <div className="mt-2 text-sm text-gray-600">
                    <p>Hệ thống sẽ tự động tính toán Điểm trung bình cộng của cả 5 thành viên Hội đồng cho đề tài:</p>
                    <Paragraph className="font-bold text-gray-800 bg-gray-50 p-2.5 rounded border border-gray-100 italic">"{tenDeTai}"</Paragraph>
                    <p className="text-red-600 font-semibold m-0">* Lưu ý: Sau khi chốt, kết quả điểm số và xếp loại sẽ lập tức gửi về chuông thông báo của Sinh viên. Đề tài chuyển sang trạng thái "Đã nghiệm thu".</p>
                </div>
            ),
            okText: 'Tính điểm & Công bố ngay',
            cancelText: 'Để rà soát lại',
            okButtonProps: { className: 'bg-[#A31D1D] font-bold border-none' },
            centered: true,
            onOk: async () => {
                try {
                    const res: any = await sendRequest({
                        url: `http://localhost:8000/api/bao-cao/${maBaoCao}/chot-nghiem-thu/`,
                        method: 'POST'
                    });
                    messageApi.success(res.message || 'Đã tổng hợp điểm và công bố kết quả nghiệm thu thành công! 🚀');
                    fetchReportsData(); // Tải lại danh sách
                } catch (error: any) {
                    messageApi.error(error.message || 'Có lỗi xảy ra khi tổng hợp điểm.');
                }
            }
        });
    };


    // ================= 4. ĐỊNH NGHĨA CÁC CỘT CỦA BẢNG CHÍNH =================
    const columns = [
        {
            title: 'MÃ BÁO CÁO',
            dataIndex: 'MaBaoCao',
            key: 'MaBaoCao',
            render: (text: string) => <strong className="font-mono text-gray-700">{text}</strong>,
        },
        {
            title: 'THÔNG TIN ĐỀ TÀI',
            key: 'projectInfo',
            render: (_: any, record: any) => (
                <div className="max-w-[450px]">
                    <div className="font-bold text-gray-800 text-sm leading-snug mb-1">{record.de_tai_info?.TenDeTai}</div>
                    <Space size="middle" className="text-xs text-gray-400">
                        <span><UserOutlined /> CN: <strong className="text-gray-600">{record.de_tai_info?.chu_nhiem}</strong></span>
                        <span>Mã ĐT: <strong className="text-gray-600 font-mono">{record.MaDeTai}</strong></span>
                    </Space>
                </div>
            )
        },
        {
            title: 'HỘI ĐỒNG PHÂN CÔNG',
            dataIndex: 'MaHoiDong',
            key: 'MaHoiDong',
            render: (text: string) => <Tag color="purple" className="font-bold border-none px-2.5 py-0.5 rounded-full uppercase text-[10px]">{text || 'Chưa gán'}</Tag>
        },
        {
            title: 'TIẾN ĐỘ CHẤM (5 PHIẾU)',
            key: 'gradingProgress',
            render: (_: any, record: any) => {
                // Giả lập hoặc lấy số lượng phiếu dựa trên data detailedScores nếu có,
                // hoặc Backend trả ra trường count (ở đây đếm độ dài mảng đã chấm)
                const scoresCount = detailedScores[record.MaDeTai]?.length ?? (record.DiemTrungBinh ? 5 : 0);
                const percent = (scoresCount / 5) * 100;
                return (
                    <div className="w-[160px]">
                        <div className="flex justify-between text-[11px] mb-1 font-bold text-gray-500">
                            <span>Tiến độ:</span>
                            <span className={scoresCount === 5 ? "text-green-600" : "text-amber-600"}>{scoresCount}/5 Phiếu</span>
                        </div>
                        <Progress percent={percent} size="small" showInfo={false} strokeColor={scoresCount === 5 ? '#52c41a' : '#faad14'} />
                    </div>
                );
            }
        },
        {
            title: 'ĐIỂM CHUNG CUỘC',
            dataIndex: 'DiemTrungBinh',
            key: 'DiemTrungBinh',
            render: (score: number) => {
                if (score !== null && score !== undefined) {
                    return <span className="text-xl font-black text-[#A31D1D] bg-red-50 px-3 py-1 rounded-lg border border-red-100">{score.toFixed(2)}</span>;
                }
                return <span className="text-gray-400 italic text-xs">Chờ tổng hợp</span>;
            }
        },
        {
            title: 'THAO TÁC',
            key: 'actions',
            render: (_: any, record: any) => {
                const scoresCount = detailedScores[record.MaDeTai]?.length ?? (record.DiemTrungBinh ? 5 : 0);
                const isFinalized = record.DiemTrungBinh !== null && record.DiemTrungBinh !== undefined;


                return (
                    <Space size="small">
                        {isFinalized ? (
                            <Tag icon={<CheckCircleOutlined />} color="success" className="font-bold border-none px-3 py-1 rounded text-xs uppercase m-0">Đã công bố</Tag>
                        ) : (
                            <Button
                                type="primary"
                                size="middle"
                                icon={<CalculatorOutlined />}
                                disabled={scoresCount < 5} // Khóa nút nếu chưa đủ 5 giảng viên chấm
                                onClick={() => handleFinalizeScore(record.MaBaoCao, record.de_tai_info?.TenDeTai, scoresCount)}
                                className={`font-bold rounded-lg border-none shadow-sm ${scoresCount === 5 ? 'bg-[#A31D1D] hover:scale-105 transition-transform' : 'bg-gray-100 text-gray-400'}`}
                            >
                                Tổng hợp điểm
                            </Button>
                        )}
                    </Space>
                );
            }
        }
    ];


    // ================= 5. GIAO DIỆN XỔ CHI TIẾT (SUB-TABLE) KHI CLICK DÒNG =================
    const expandedRowRender = (record: any) => {
        const projectScores = detailedScores[record.MaDeTai] || [];
        const isDetailsLoading = loadingDetails[record.MaDeTai];


        return (
            <Card title={<span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><FileTextOutlined className="text-[#A31D1D]" /> Chi tiết kết quả chấm điểm độc lập của Hội đồng</span>} className="shadow-inner border-gray-100 mx-4 bg-gray-50/50" size="small">
                <Table
                    loading={isDetailsLoading}
                    dataSource={projectScores}
                    rowKey="MaDanhGia"
                    pagination={false}
                    size="small"
                    className="bg-white rounded-lg border border-gray-100 shadow-sm"
                    columns={[
                        {
                            title: 'GIẢNG VIÊN CHẤM',
                            key: 'teacher',
                            render: (_, item) => (
                                <Space>
                                    <Avatar size="small" icon={<UserOutlined />} className="bg-gray-400" />
                                    <div>
                                        <div className="font-bold text-gray-800 text-xs">{item.thanh_vien_info?.TenGV}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{item.thanh_vien_info?.MaGV}</div>
                                    </div>
                                </Space>
                            )
                        },
                        {
                            title: 'VAI TRÒ TRONG HỘI ĐỒNG',
                            dataIndex: ['thanh_vien_info', 'VaiTro'],
                            key: 'vaitro',
                            render: (role: string) => <Tag className="font-semibold text-[10px] border-gray-200 text-gray-600 bg-gray-100">{role}</Tag>
                        },
                        {
                            title: 'ĐIỂM SỐ',
                            dataIndex: 'DiemSo',
                            key: 'DiemSo',
                            render: (score: number) => <strong className="text-sm text-[#A31D1D] font-mono">{score.toFixed(1)}</strong>
                        },
                        {
                            title: 'XẾP LOẠI',
                            dataIndex: 'XepLoai_display',
                            key: 'XepLoai_display',
                            render: (display: string) => <span className="text-xs font-medium text-gray-700">{display}</span>
                        },
                        {
                            title: 'NỘI DUNG NHẬN XÉT CHI TIẾT',
                            dataIndex: 'NhanXet',
                            key: 'NhanXet',
                            render: (text: string) => (
                                <Popover content={<div className="max-w-[400px] text-xs leading-relaxed whitespace-pre-wrap">{text}</div>} title="Nội dung nhận xét đầy đủ" trigger="hover">
                                    <div className="text-xs text-gray-500 max-w-[300px] truncate cursor-help italic">
                                        <MessageOutlined className="mr-1 text-gray-400" /> "{text}"
                                    </div>
                                </Popover>
                            )
                        }
                    ]}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-xs text-gray-400">Chưa có thành viên nào nộp phiếu điểm trực tuyến.</span>} /> }}
                />
            </Card>
        );
    };


    return (
        <div className="space-y-6">
            {contextHolder}


            {/* Lưới thông báo hướng dẫn nghiệp vụ */}
            <div className="bg-[#FFF5F5] border border-red-100 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-2">
                <ExclamationCircleOutlined className="text-xl text-[#A31D1D] mt-0.5" />
                <div>
                    <h4 className="font-bold text-red-800 text-sm mb-0.5 uppercase tracking-wide">Quy định Chốt sổ nghiệm thu</h4>
                    <p className="text-xs text-red-600 leading-relaxed m-0 font-medium">
                        Hệ thống yêu cầu <strong>toàn bộ 05 thành viên</strong> trong Hội đồng chấm thi phải hoàn tất nhập điểm và ghi phiếu đánh giá chuyên môn trực tuyến. Khi đạt đủ 5/5 phiếu, nút <strong>"Tổng hợp điểm"</strong> sẽ tự động kích hoạt để Cán bộ tiến hành tính điểm trung bình cộng chung cuộc và công bố kết quả cho Sinh viên.
                    </p>
                </div>
            </div>


            {/* Bảng dữ liệu chính */}
            <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    loading={loading}
                    dataSource={reports}
                    columns={columns}
                    rowKey="MaBaoCao"
                    pagination={{ pageSize: 10, size: 'small' }}
                    className="manager-evaluation-table"
                    // 🌟 MỞ RỘNG DÒNG: Khi cán bộ bấm mở rộng dòng, lùng tìm phiếu chấm của Đề tài đó ngay
                    expandable={{
                        expandedRowRender,
                        onExpand: (expanded, record) => {
                            if (expanded) fetchProjectScores(record.MaDeTai);
                        }
                    }}
                    locale={{ emptyText: <Empty description="Hiện không có đề tài nào trong đợt nghiệm thu này." /> }}
                />
            </Card>
        </div>
    );
}



