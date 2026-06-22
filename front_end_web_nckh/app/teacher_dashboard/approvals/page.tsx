'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, InputNumber, Input, Spin, message, ConfigProvider } from 'antd';
import {
    DownloadOutlined,
    EnvironmentOutlined,
    UserOutlined,
    IdcardOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

export default function CouncilEvaluationPage() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [evaluationProjects, setEvaluationProjects] = useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    // States điều khiển Modal Nhập điểm
    const [isScoreModalVisible, setIsScoreModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();

    // States điều khiển Modal Xem Báo Cáo
    const [isDocModalVisible, setIsDocModalVisible] = useState(false);

    // ================= 1. FETCH DATA TỪ BACKEND =================
    const fetchCouncilData = async () => {
        setLoading(true);
        try {
            const [userRes, projectsRes] = await Promise.all([
                sendRequest<any>({ url: 'http://localhost:8000/api/me/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/bao-cao/?TrangThai=CHONGHIEMTHU', method: 'GET' })
            ]);

            setUserData(userRes);
            setEvaluationProjects(projectsRes.results || projectsRes || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu hội đồng:", error);
            messageApi.error("Không thể kết nối danh sách hội đồng nghiệm thu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouncilData();
    }, []);

    // Helper bốc đường link file báo cáo (Ưu tiên link tuyệt đối từ Backend trả về)
    const getFileUrl = (projectItem: any) => {
        const rawUrl = projectItem?.FileBaoCao || projectItem?.DuongDanFile;
        if (!rawUrl) return null;
        return rawUrl.startsWith('http') ? rawUrl : `http://localhost:8000${rawUrl}`;
    };

    // Helper bốc mã Hội đồng chuẩn xác từ tất cả các vị trí dự phòng
    const getCouncilCode = (projectItem: any) => {
        return projectItem?.MaHoiDong ||
            projectItem?.hoi_dong_info?.MaHoiDong ||
            projectItem?.de_tai_info?.hoi_dong_info?.MaHoiDong ||
            'Chưa gán';
    };

    // ================= 2. LOGIC NỘP PHIẾU CHẤM ĐIỂM =================
    const handleOpenScoreModal = (project: any) => {
        setSelectedProject(project);
        setIsScoreModalVisible(true);
    };

    const handleScoreSubmit = async (values: any) => {
        const maHoiDong = getCouncilCode(selectedProject);
        const maDeTai = selectedProject?.de_tai_info?.MaDeTai || selectedProject?.MaDeTai;

        // ❌ ĐÃ XÓA ĐOẠN IF CHẶN MÃ HỘI ĐỒNG Ở ĐÂY ❌

        setIsSubmitting(true);
        try {
            await sendRequest({
                url: 'http://localhost:8000/api/danh-gia/',
                method: 'POST',
                body: {
                    // Nếu là "Chưa gán" thì gửi null để Backend không báo lỗi
                    MaHoiDong: (maHoiDong && maHoiDong !== 'Chưa gán') ? maHoiDong : null,
                    MaDeTai: maDeTai,
                    DiemSo: values.DiemSo,
                    NhanXet: values.NhanXet
                }
            });

            messageApi.success(`Thầy/Cô đã nộp phiếu điểm báo cáo [${selectedProject.MaBaoCao}] thành công!`);
            setIsScoreModalVisible(false);
            form.resetFields();
            fetchCouncilData();
        } catch (error: any) {
            messageApi.error(error.message || 'Nộp phiếu điểm thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-6">
                {contextHolder}

                {/* ================= HEADER ================= */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Hội đồng Đánh giá &amp; Nghiệm thu</h1>
                        <p className="text-gray-500 text-sm">
                            Xin chào Thầy/Cô <strong className="text-gray-800">{userData?.TenHienThi}</strong>. Hãy thực hiện rà soát báo cáo và nhập điểm đánh giá độc lập.
                        </p>
                    </div>
                </div>

                {/* ================= KHUNG LƯỚI CHÍNH ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tổng số báo cáo phân công: ({evaluationProjects.length})</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Học viện Kỹ thuật Mật mã</span>
                        </div>

                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Danh sách Báo cáo chờ chấm điểm</h3>
                                <div className="flex-1 border-b border-gray-100"></div>
                            </div>

                            {evaluationProjects.map((project) => (
                                <div key={project.MaBaoCao} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden mb-4 hover:shadow-md transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#A31D1D]"></div>
                                    <div className="flex justify-between items-center mb-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-red-50 text-[#A31D1D] font-bold text-[10px] px-2 py-1 rounded uppercase">
                                                HĐ: {getCouncilCode(project)}
                                            </span>
                                            {project.VaiTroHoiDong && (
                                                <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-2 py-1 rounded uppercase">
                                                    Vai trò: {project.VaiTroHoiDong}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded uppercase flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Sẵn sàng chấm điểm
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-snug pl-2">{project.de_tai_info?.TenDeTai || 'Tên đề tài chưa cập nhật'}</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 mb-6 ml-2">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white p-2 rounded-md shadow-sm text-gray-400"><UserOutlined /></div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nhóm trưởng / Chủ nhiệm</div>
                                                <div className="text-sm font-bold text-gray-800">{project.de_tai_info?.chu_nhiem || 'Sinh viên'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white p-2 rounded-md shadow-sm text-[#A31D1D]"><IdcardOutlined /></div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mã định danh đề tài</div>
                                                <div className="text-sm font-black text-[#A31D1D] uppercase">{project.de_tai_info?.MaDeTai || '---'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 md:col-span-2">
                                            <div className="bg-white p-2 rounded-md shadow-sm text-gray-400"><FileTextOutlined /></div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Giảng viên hướng dẫn</div>
                                                <div className="text-sm font-semibold text-gray-700">{project.de_tai_info?.gv_huong_dan || 'Đang cập nhật'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 pl-2 gap-4">
                                        <div className="text-gray-500 text-sm font-medium flex items-center gap-1.5">
                                            <EnvironmentOutlined className="text-[#A31D1D]" />
                                            {project.hoi_dong_info?.DiaDiem || project.de_tai_info?.hoi_dong_info?.DiaDiem || 'Phòng hội thảo KMA'}
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <Button
                                                className="font-semibold text-gray-600 h-9 px-5 flex-1 sm:flex-none"
                                                onClick={() => { setSelectedProject(project); setIsDocModalVisible(true); }}
                                            >
                                                Xem báo cáo
                                            </Button>
                                            <Button
                                                type="primary"
                                                className="font-semibold bg-[#A31D1D] border-none h-9 px-6 flex-1 sm:flex-none"
                                                onClick={() => handleOpenScoreModal(project)}
                                            >
                                                Nhập điểm
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {evaluationProjects.length === 0 && <p className="text-xs text-gray-400 italic pl-2">Thầy/Cô hiện chưa có báo cáo nào cần chấm điểm.</p>}
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Cơ cấu chấm thi</h3>
                            <p className="text-xs text-gray-600 leading-relaxed m-0">
                                Thầy/Cô vui lòng thực hiện chấm điểm độc lập dựa trên báo cáo và kết quả thực tế của sinh viên. Điểm số cuối cùng của đề tài sẽ là điểm trung bình cộng của cả 5 thành viên Hội đồng.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= MODAL 1: NHẬP ĐIỂM HỘI ĐỒNG ================= */}
                {/* ================= MODAL 1: NHẬP ĐIỂM HỘI ĐỒNG ================= */}
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Phiếu chấm điểm Hội đồng Nghiệm thu</span>}
                    open={isScoreModalVisible}
                    onCancel={() => { setIsScoreModalVisible(false); form.resetFields(); }}
                    footer={null}
                    centered
                >
                    <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100 text-xs">
                        {/* 🌟 MOI ĐÚNG CHỖ: Lấy tên đề tài từ de_tai_info và Mã HD từ object Báo Cáo */}
                        <p className="mb-1 text-gray-500 font-semibold">ĐỀ TÀI: <span className="text-gray-800 font-bold">"{selectedProject?.de_tai_info?.TenDeTai}"</span></p>
                        <p className="m-0 text-gray-500 font-semibold">MÃ HỘI ĐỒNG: <span className="text-[#A31D1D] font-black">{selectedProject?.MaHoiDong || 'Đang cập nhật'}</span></p>
                    </div>


                    <Form form={form} layout="vertical" onFinish={handleScoreSubmit} size="large">
                        <Form.Item
                            label={<span className="font-bold text-gray-700 text-sm">Điểm số đánh giá (Thang điểm 10)</span>}
                            name="DiemSo"
                            rules={[
                                { required: true, message: 'Vui lòng nhập điểm!' },
                                { type: 'number', min: 0, max: 10, message: 'Điểm số hợp lệ từ 0.0 đến 10.0!' }
                            ]}
                        >
                            <InputNumber placeholder="Nhập điểm số (VD: 8.5)" className="w-full rounded-lg" step={0.1} min={0} max={10} />
                        </Form.Item>


                        <Form.Item
                            label={<span className="font-bold text-gray-700 text-sm">Nội dung nhận xét / Đánh giá chuyên môn</span>}
                            name="NhanXet"
                            rules={[{ required: true, message: 'Vui lòng điền nội dung nhận xét!' }]}
                        >
                            <Input.TextArea rows={5} placeholder="Nhập nội dung đánh giá chi tiết..." className="rounded-lg text-sm" />
                        </Form.Item>


                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button onClick={() => { setIsScoreModalVisible(false); form.resetFields(); }}>Hủy bỏ</Button>
                            <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-[#A31D1D] font-bold border-none px-6">
                                Nộp phiếu điểm
                            </Button>
                        </div>
                    </Form>
                </Modal>





                {/* ================= MODAL 2: XEM CHI TIẾT BÁO CÁO ================= */}
                {/* ================= MODAL 2: XEM CHI TIẾT BÁO CÁO ================= */}
                <Modal
                    title={<span className="font-black text-lg text-gray-800">Thông tin Báo cáo Nghiệm thu</span>}
                    open={isDocModalVisible}
                    onCancel={() => setIsDocModalVisible(false)}
                    footer={[<Button key="close" onClick={() => setIsDocModalVisible(false)}>Đóng hồ sơ</Button>]}
                    width={650}
                    centered
                >
                    <div className="py-4 space-y-4 text-sm">
                        <div>
                            <span className="font-bold text-gray-400 text-xs uppercase tracking-wider block mb-1">Tên đề tài nghiên cứu</span>
                            <p className="font-bold text-gray-800 text-base leading-relaxed m-0">"{selectedProject?.de_tai_info?.TenDeTai}"</p>
                        </div>
                        <div>
                            <span className="font-bold text-gray-400 text-xs uppercase tracking-wider block mb-1">Nội dung tóm tắt đề tài</span>
                            <p className="text-gray-600 bg-gray-50 border border-gray-100 p-3 rounded-lg leading-relaxed m-0 text-xs min-h-[60px]">
                                {selectedProject?.de_tai_info?.TomTat || 'Không có bản tóm tắt nội dung.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <span className="font-bold text-gray-400 text-xs uppercase tracking-wider block mb-1">Mã đề tài</span>
                                <strong className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{selectedProject?.de_tai_info?.MaDeTai || '---'}</strong>
                            </div>

                            {/* 🌟 NÚT TẢI FILE BÁO CÁO VỚI LOGIC XỬ LÝ URL */}
                            <div>
                                <span className="font-bold text-gray-400 text-xs uppercase tracking-wider block mb-2">File báo cáo (.pdf / .docx)</span>
                                {selectedProject?.FileBaoCao || selectedProject?.DuongDanFile ? (
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        className="bg-[#A31D1D] hover:bg-red-800 font-bold text-xs h-auto py-1.5 px-3 border-none shadow-sm flex items-center"
                                        href={selectedProject.FileBaoCao || selectedProject.DuongDanFile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Mở xem Báo cáo toàn văn
                                    </Button>
                                ) : (
                                    <span className="text-orange-500 font-medium text-xs italic bg-orange-50 border border-orange-100 px-2 py-1 rounded">
                                        Không tìm thấy file hoặc bạn không có quyền xem.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>


            </div>
        </ConfigProvider>
    );
}