'use client';


import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Space, Row, Col, Statistic, Progress, List, Avatar, Typography, Skeleton, Result, ConfigProvider } from 'antd';
import {
    TrophyOutlined,
    MessageOutlined,
    UserOutlined,
    FileDoneOutlined,
    CalendarOutlined,
    CarryOutOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';
import dayjs from 'dayjs';


const { Text, Title, Paragraph } = Typography;


export default function StudentScorePage() {
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [detailedScores, setDetailedScores] = useState<any[]>([]);


    // ================= 1. FETCH DATA ĐIỂM & ĐỀ TÀI TỪ BACKEND =================
    const fetchScoreData = async () => {
        setLoading(true);
        try {
            // Lấy thông tin đề tài nội bộ của sinh viên này
            const deTaiRes = await sendRequest<any>({
                url: 'http://localhost:8000/api/de-tai/',
                method: 'GET'
            });
            const myProject = deTaiRes.results?.[0] || deTaiRes[0] || null;
            setProject(myProject);


            if (myProject) {
                // Nếu đã có đề tài, lôi luôn danh sách phiếu điểm Hội đồng đã chấm ra
                const danhGiaRes = await sendRequest<any>({
                    url: `http://localhost:8000/api/danh-gia/?MaDeTai=${myProject.MaDeTai}`,
                    method: 'GET'
                });
                setDetailedScores(danhGiaRes.results || danhGiaRes || []);
            }
        } catch (error) {
            console.error("Lỗi tải bảng điểm:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchScoreData();
    }, []);


    // Helper tự động bốc nhãn Xếp loại theo điểm số (phòng hờ Backend chưa xử lý chuỗi chữ)
    const getXepLoaiDisplay = (score: number) => {
        if (score >= 9.0) return { text: 'A+', color: 'purple' };
        if (score >= 8.5) return { text: 'A', color: 'green' };
        if (score >= 7.8) return { text: 'B+', color: 'blue' };
        if (score >= 7) return { text: 'B', color: 'blue' };
        if (score >= 2.4) return { text: 'C+', color: 'orange' };
        if (score >= 2) return { text: 'C', color: 'orange' };
        if (score >= 2.4) return { text: 'D+', color: 'red' };
        return { text: 'F', color: 'red' };
    };


    if (loading) return <div className="p-8 max-w-[1400px] mx-auto"><Skeleton active paragraph={{ rows: 12 }} /></div>;


    // ── TRƯỜNG HỢP 1: SINH VIÊN CHƯA CÓ ĐỀ TÀI ──
    if (!project) {
        return (
            <Result
                status="warning"
                title="Bạn chưa có dữ liệu đề tài nghiên cứu"
                subTitle="Vui lòng tiến hành đăng ký đề tài ở trang chủ để tham gia tiến trình nghiệm thu."
            />
        );
    }


    // ── TRƯỜNG HỢP 2: ĐÃ NỘP BÀI NHƯNG HỘI ĐỒNG HOẶC CÁN BỘ CHƯA CHỐT ĐIỂM CHUNG CUỘC ──
    const isFinalized = project.DiemTongHop !== null && project.DiemTongHop !== undefined;
    if (!isFinalized) {
        return (
            <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
                <div className="max-w-[1000px] mx-auto py-12">
                    <Result
                        icon={<ClockCircleOutlined className="text-amber-500 text-6xl animate-pulse" />}
                        title={<span className="font-black text-gray-800 text-2xl uppercase">Hồ sơ đang trong quá trình nghiệm thu</span>}
                        subTitle={
                            <div className="text-gray-500 max-w-xl mx-auto mt-2 leading-relaxed">
                                Đề tài <strong className="text-gray-700">" {project.TenDeTai} "</strong> của nhóm bạn đã được khóa để gửi lên Hội đồng. Hiện tại các Thầy/Cô đang tiến hành soát xét và nhập phiếu điểm độc lập. Kết quả chính thức sẽ hiển thị tại đây ngay sau khi Cán bộ quản lý bấm nút tổng hợp.
                            </div>
                        }
                        extra={[
                            <Button type="primary" key="refresh" onClick={fetchScoreData} className="bg-[#A31D1D] font-bold h-10 px-6 rounded-lg border-none shadow-sm">
                                Làm mới dữ liệu
                            </Button>
                        ]}
                    />
                </div>
            </ConfigProvider>
        );
    }


    // ── TRƯỜNG HỢP 3: CÁN BỘ ĐÃ BẤM TỔNG HỢP - HIỂN THỊ BẢNG ĐIỂM RỰC RỠ ──
    const xl = getXepLoaiDisplay(project.DiemTongHop);


    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6 animate-fade-in">


                {/* ================= TIÊU ĐỀ TRANG ================= */}
                <div className="border-b border-gray-200 pb-4 mb-2">
                    <h1 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-2">
                        <SafetyCertificateOutlined className="text-[#A31D1D]" /> Kết Quả Nghiệm Thu Đồ Án
                    </h1>
                    <p className="text-gray-500 text-sm">Thông tin điểm số chính thức và nhận xét đánh giá chuyên môn từ Hội đồng Khoa học.</p>
                </div>


                {/* ================= KHUNG LƯỚI CHÍNH ================= */}
                <Row gap={[24, 24]} className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">


                    {/* ----- CỘT TRÁI: CHỨNG NHẬN ĐIỂM & CHI TIẾT LỜI PHÊ (2/3) ----- */}
                    <div className="xl:col-span-2 space-y-6 flex flex-col gap-6">


                        {/* CARD 1: TỔNG HỢP KẾT QUẢ HOÀNH TRÁNG */}
                        <Card className="rounded-xl shadow-sm border-gray-200 overflow-hidden relative" style={{ borderTop: '4px solid #A31D1D' }}>
                            <div className="absolute right-6 top-6 opacity-10 text-9xl text-[#A31D1D] pointer-events-none">
                                <TrophyOutlined />
                            </div>


                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Đề tài nghiên cứu khoa học</span>
                            <Title level={3} className="text-gray-800 leading-snug font-black mt-0 mb-6 pr-20">"{project.TenDeTai}"</Title>


                            <Divider className="my-4 border-gray-100" />


                            <Row className="flex flex-col sm:flex-row justify-between items-center gap-6 py-2">
                                <div className="flex items-center gap-6">
                                    {/* Khối hiển thị Điểm Số to đùng */}
                                    <div className="bg-red-50/50 border border-red-100 rounded-2xl px-6 py-4 text-center shadow-inner min-w-[130px]">
                                        <div className="text-[10px] font-bold text-[#A31D1D] uppercase tracking-wider mb-1">Điểm Hội Đồng</div>
                                        <div className="text-4xl font-black text-[#A31D1D] font-mono leading-none">{project.DiemTongHop.toFixed(2)}</div>
                                    </div>


                                    {/* Khối hiển thị Xếp loại */}
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Xếp loại chung cuộc</div>
                                        <Tag color={xl.color} className="font-black border-none text-sm px-4 py-1 rounded uppercase tracking-wide">
                                            {xl.text}
                                        </Tag>
                                    </div>
                                </div>


                                <div className="text-right text-xs text-gray-400 font-medium space-y-1">
                                    <div><CalendarOutlined /> Ngày công bố: {dayjs().format('DD/MM/YYYY')}</div>
                                    <div><FileDoneOutlined /> Trạng thái: <span className="text-green-600 font-bold">ĐÃ NGHIỆM THU</span></div>
                                </div>
                            </Row>
                        </Card>


                        {/* CARD 2: CHI TIẾT NHẬN XÉT CỦA 5 THẦY CÔ HỘI ĐỒNG */}
                        <Card title={<span className="font-black text-sm text-gray-800 uppercase tracking-wider flex items-center gap-2"><MessageOutlined className="text-[#A31D1D]" /> Bảng lời phê &amp; Đánh giá chuyên môn chi tiết</span>} className="rounded-xl shadow-sm border-gray-200">
                            <List
                                itemLayout="horizontal"
                                dataSource={detailedScores}
                                renderItem={(item, idx) => (
                                    <List.Item className="border-b border-gray-100 last:border-none py-4 px-2 hover:bg-gray-50/50 transition-colors rounded-lg">
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar className="bg-red-50 text-[#A31D1D] font-bold shadow-sm">
                                                    {idx + 1}
                                                </Avatar>
                                            }
                                            title={
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-gray-800 text-sm">
                                                        {item.thanh_vien_info?.VaiTro || 'Thành viên Hội đồng'}
                                                    </span>
                                                    <Space>
                                                        <span className="text-xs text-gray-400 font-medium">Điểm chấm:</span>
                                                        <Tag className="font-mono font-black text-xs text-[#A31D1D] bg-red-50 border-none px-2 rounded">
                                                            {item.DiemSo.toFixed(1)}
                                                        </Tag>
                                                    </Space>
                                                </div>
                                            }
                                            description={
                                                <div className="mt-2 text-gray-600 text-xs leading-relaxed whitespace-pre-wrap italic bg-gray-50/60 p-3 rounded-lg border border-gray-100/50">
                                                    "{item.NhanXet || 'Không có ý kiến nhận xét bổ sung.'}"
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </div>


                    {/* ----- CỘT PHẢI: METADATA & THÀNH PHẦN NHÓM (1/3) ----- */}
                    <div className="xl:col-span-1 flex flex-col gap-6">


                        {/* QUY CHẾ TÍNH ĐIỂM */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cơ chế tổng hợp điểm</h3>
                            <p className="text-xs text-gray-500 leading-relaxed m-0">
                                Điểm chung cuộc của đề tài được tính bằng phương pháp <strong>Trung bình cộng toán học</strong> của cả 5 phiếu điểm độc lập từ các thành viên Hội đồng nghiệm thu (bao gồm Chủ tịch, Thư ký, 2 Ủy viên phản biện và Ủy viên Hội đồng). Quy trình đảm bảo tính khách quan tối đa.
                            </p>
                        </div>


                        {/* THÔNG TIN CHỨNG NHẬN ĐỒ ÁN */}
                        <Card title={<span className="font-black text-xs text-gray-500 uppercase tracking-wider">Thông tin quyết định</span>} className="rounded-xl shadow-sm border-gray-200" size="small">
                            <div className="space-y-4 text-xs py-2">
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-400 font-medium">Mã định danh đề tài:</span>
                                    <strong className="text-gray-800 font-mono">{project.MaDeTai}</strong>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-400 font-medium">Hội đồng chấm thi:</span>
                                    <strong className="text-[#A31D1D] font-bold uppercase">{project.MaHoiDong || 'HĐ KMA'}</strong>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-400 font-medium">Giảng viên hướng dẫn:</span>
                                    <strong className="text-gray-800">{project.gv_huong_dan}</strong>
                                </div>
                                <div className="flex justify-between m-0">
                                    <span className="text-gray-400 font-medium">Đợt bảo vệ:</span>
                                    <strong className="text-gray-800">Học kỳ 1 - Năm học 2026</strong>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Row>
            </div>
        </ConfigProvider>
    );
}


// Bổ sung một chút css divider nếu ní chưa import
const Divider = ({ className }: { className?: string }) => <div className={`border-t ${className}`} />;

