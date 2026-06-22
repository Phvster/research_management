'use client';


import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Upload, Tag, Divider, Skeleton, Modal, InputNumber, message, Form, Select, Avatar, ConfigProvider } from 'antd';
import { UploadOutlined, FormOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
    UserOutlined, CalendarOutlined, InboxOutlined, MessageOutlined,
    FileTextOutlined, CheckOutlined, SyncOutlined, LockOutlined,
    RobotOutlined, CloseOutlined, SaveOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';


const { TextArea } = Input;
const { Dragger } = Upload;


export default function StudentDashboardPage() {
    const [finalFile, setFinalFile] = useState<File | null>(null);
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [progressList, setProgressList] = useState<any[]>([]);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [messageApi, contextHolder] = message.useMessage();


    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [newProgress, setNewProgress] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [form] = Form.useForm();
    const [rawStudents, setRawStudents] = useState<any[]>([]);
    const [studentsOptions, setStudentsOptions] = useState<{ label: string; value: string }[]>([]);
    const [teachersOptions, setTeachersOptions] = useState<{ label: string; value: string }[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<any[]>([]);


    const fetchDashboardData = async () => {
        try {
            const [userRes, deTaiRes, tienDoRes, svRes, gvRes] = await Promise.all([
                sendRequest<any>({ url: 'http://localhost:8000/api/me/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/de-tai/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/tien-do/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/sinh-vien/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/giang-vien/', method: 'GET' })
            ]);


            setUserData(userRes);
            const myMaSV = userRes?.MaDinhDanh;


            if (deTaiRes.results && deTaiRes.results.length > 0) {
                setProject(deTaiRes.results[0]);
            } else if (Array.isArray(deTaiRes) && deTaiRes.length > 0) {
                setProject(deTaiRes[0]);
            } else {
                setProject(null);
            }


            if (tienDoRes.results && tienDoRes.results.length > 0) {
                setProgressPercent(tienDoRes.results[0].TyLeHoanThanh);
                setProgressList(tienDoRes.results);
            } else if (Array.isArray(tienDoRes) && tienDoRes.length > 0) {
                setProgressPercent(tienDoRes[0].TyLeHoanThanh);
                setProgressList(tienDoRes);
            }


            const svData = svRes.results || svRes;
            setRawStudents(svData);
            const availableStudents = svData.filter((sv: any) => sv.MaSV !== myMaSV && !sv.MaDeTai);
            setStudentsOptions(availableStudents.map((sv: any) => ({
                label: `${sv.MaSV} - ${sv.TenSV} (${sv.Lop})`,
                value: sv.MaSV
            })));


            const gvData = gvRes.results || gvRes;
            setTeachersOptions(gvData.map((gv: any) => ({
                label: `${gv.HocHamHocVi || ''} ${gv.TenGV} (${gv.MaGV})`.trim(),
                value: gv.MaGV
            })));


        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDashboardData();
    }, []);


    const handleAddStudent = (maSV: string) => {
        if (selectedTeam.length >= 4) {
            message.warning("Một nhóm chỉ có tối đa 5 thành viên (gồm cả bạn)!");
            return;
        }
        const studentObj = rawStudents.find(s => s.MaSV === maSV);
        if (studentObj && !selectedTeam.some(s => s.MaSV === maSV)) {
            const newTeam = [...selectedTeam, studentObj];
            setSelectedTeam(newTeam);
            form.setFieldsValue({ DanhSachThanhVien: newTeam.map(s => s.MaSV) });
        }
    };


    const handleRemoveStudent = (maSV: string) => {
        const newTeam = selectedTeam.filter(s => s.MaSV !== maSV);
        setSelectedTeam(newTeam);
        form.setFieldsValue({ DanhSachThanhVien: newTeam.map(s => s.MaSV) });
    };


    const handleRegisterSubmit = async (values: any) => {
        setIsRegistering(true);
        try {
            const payload: any = {
                MaDeTai: values.MaDeTai,
                TenDeTai: values.TenDeTai,
                TomTat: values.TomTat,
                TrangThai: 'CHODUYET_KHOA'
            };


            if (selectedTeam.length > 0) {
                payload.DanhSachThanhVien = selectedTeam.map(s => s.MaSV);
            }
            if (values.MaGV_HuongDan) {
                payload.MaGV_HuongDan = values.MaGV_HuongDan;
            }


            await sendRequest({
                url: 'http://localhost:8000/api/de-tai/',
                method: 'POST',
                body: payload
            });


            message.success("Đăng ký đề tài thành công! Hệ thống đang chờ duyệt.");
            setIsRegisterModalVisible(false);
            form.resetFields();
            setSelectedTeam([]);
            fetchDashboardData();
        } catch (error: any) {
            let errorMsg = "Có lỗi xảy ra khi lưu đề tài.";
            const errData = error?.error || error;
            if (errData) {
                if (errData.MaDeTai) errorMsg = `Mã đề tài: ${errData.MaDeTai[0]}`;
                else if (errData.TenDeTai) errorMsg = `Tên đề tài: ${errData.TenDeTai[0]}`;
                else if (errData.detail) errorMsg = errData.detail;
            }
            message.error(errorMsg);
        } finally {
            setIsRegistering(false);
        }
    };


    const handleUploadSubmit = async () => {
        if (!uploadFile) return messageApi.error('Quên chọn file báo cáo rồi kìa!');
        if (!project) return messageApi.error('Lỗi: Bạn chưa có đề tài.');


        setIsSubmitting(true);
        const formData = new FormData();


        // 1. Gắn đúng tên trường Backend yêu cầu: FileMinhChung
        formData.append('FileMinhChung', uploadFile);
        formData.append('TyLeHoanThanh', newProgress.toString());
        // Bỏ dòng formData.append('NoiDung', ...) đi vì Backend TienDo không có trường này


        try {
            const token = localStorage.getItem('accessToken');


            // Dùng fetch thuần để gửi FormData là chuẩn bài, vì nó tự động gen boundary
            const res = await fetch('http://localhost:8000/api/tien-do/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Tuyệt đối KHÔNG ghi 'Content-Type': 'multipart/form-data' ở đây nhé!
                },
                body: formData
            });


            if (!res.ok) {
                const errData = await res.json();
                console.error("Lỗi từ server:", errData);
                throw new Error(errData.detail || errData.FileMinhChung?.[0] || 'Nộp báo cáo thất bại!');
            }


            messageApi.success('Tuyệt vời! Đã nộp báo cáo kèm file thành công!');
            setIsUploadModalVisible(false);
            setUploadFile(null); // Reset lại file sau khi gửi
            fetchDashboardData(); // Cập nhật lại UI
        } catch (error: any) {
            messageApi.error(error.message || 'Có lỗi xảy ra khi nộp bài.');
        } finally {
            setIsSubmitting(false);
        }
    };


    // ================= HÀM NỘP BÁO CÁO CUỐI KỲ (CHỐT SỔ) =================
    const handleFinalSubmit = async () => {
        if (!finalFile) return messageApi.error('Bạn chưa đính kèm file báo cáo nghiệm thu!');
        if (!project) return messageApi.error('Lỗi: Bạn chưa có đề tài.');


        // Bật hộp thoại cảnh báo cực gắt để Sinh viên suy nghĩ kỹ trước khi nộp
        Modal.confirm({
            title: <span className="text-red-600 font-black">Cảnh báo: Nộp Báo cáo Cuối kỳ</span>,
            icon: <ExclamationCircleOutlined className="text-red-500" />,
            content: (
                <div className="mt-2 text-gray-600">
                    <p>Đây là báo cáo chính thức và duy nhất để nhà trường phân công Hội đồng chấm điểm.</p>
                    <p className="font-bold text-gray-800">Sau khi bấm nộp, đề tài sẽ bị KHÓA và bạn KHÔNG THỂ CHỈNH SỬA nộp lại được nữa. Bạn chắc chắn chứ?</p>
                </div>
            ),
            okText: 'Chắc chắn, Nộp ngay',
            okType: 'danger',
            cancelText: 'Khoan, để kiểm tra lại',
            onOk: async () => {
                setIsSubmittingFinal(true);
                const formData = new FormData();
                formData.append('MaBaoCao', `BC-${project.MaDeTai}`);
                formData.append('MaDeTai', project.MaDeTai);
                formData.append('FileBaoCao', finalFile);
                formData.append('GhiChu', "Nộp báo cáo nghiệm thu lần cuối");


                try {
                    const token = localStorage.getItem('accessToken');
                    // 1. Gọi API lưu Báo cáo
                    const resUpload = await fetch('http://localhost:8000/api/bao-cao/', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });


                    if (!resUpload.ok) throw new Error('Nộp báo cáo thất bại!');

                    messageApi.success('Thành công! Đề tài đã được chốt và gửi đi chờ Hội đồng nghiệm thu.');
                    setFinalFile(null);
                    fetchDashboardData(); // F5 giao diện
                } catch (error: any) {
                    messageApi.error(error.message || 'Có lỗi xảy ra khi nộp bài.');
                } finally {
                    setIsSubmittingFinal(false);
                }
            }
        });
    };


    const getProgressBarWidth = () => {
        if (!project) return 0;
        if (project.TrangThai === 'CHODUYET') return 0;
        if (project.TrangThai === 'DANGHIEMTHU') return 100;


        if (progressPercent >= 50) {
            return Math.max(66.67, progressPercent);
        } else {
            return Math.max(33.33, progressPercent);
        }
    };


    if (loading) return <div className="p-8"><Skeleton active paragraph={{ rows: 12 }} /></div>;


    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto">
                {contextHolder}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">
                            Chào buổi sáng, {userData?.TenHienThi?.split(' ').pop() || 'bạn'}! 👋
                        </h1>
                        <p className="text-gray-500 text-sm">Chào mừng bạn đến với Không gian quản lý nghiên cứu khoa học.</p>
                    </div>


                    {project && project.TrangThai === 'DANGTHUCHIEN' && (
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            className="font-semibold bg-[#A31D1D] border-none h-10 px-4 rounded-lg shadow-sm hover:scale-105 transition-transform"
                            onClick={() => {
                                setNewProgress(progressPercent || 0);
                                setIsUploadModalVisible(true);
                            }}
                        >
                            Nộp báo cáo định kỳ
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">


                        <Card style={{ borderTop: "4px solid #A31D1D" }} className="rounded-xl shadow-sm border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-red-700 tracking-widest uppercase">Thông tin đề tài</span>
                                {project && (
                                    <div className="bg-[#FEE2E2] text-[#A31D1D] font-bold px-3 py-1 rounded-full text-xs flex items-center">
                                        <SyncOutlined spin={project.TrangThai === 'CHODUYET'} className="mr-1.5" />
                                        {project.TrangThai_display || project.TrangThai}
                                    </div>
                                )}
                            </div>
                            {!project ? (
                                <div className="py-6 my-2 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Bạn chưa đăng ký đề tài nghiên cứu nào!</h3>
                                    <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">Hãy thực hiện đăng ký đề tài nghiên cứu khoa học ngay để bắt đầu tiến trình thực hiện đồ án.</p>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<FormOutlined />}
                                        className="bg-[#A31D1D] border-none font-bold rounded-lg shadow-md hover:scale-105 px-6"
                                        onClick={() => setIsRegisterModalVisible(true)}
                                    >
                                        Đăng ký đề tài mới ngay
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-snug pr-10">{project.TenDeTai}</h2>
                                    <div className="flex gap-8 text-sm text-red-800 mb-12 font-medium">
                                        <span className="flex items-center gap-2"><UserOutlined /> GVHD: {project.gv_huong_dan || 'Chưa phân công'}</span>
                                        <span className="flex items-center gap-2"><CalendarOutlined /> Bắt đầu: {project.NgayTao ? new Date(project.NgayTao).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                                    </div>


                                    <div>
                                        <div className="flex justify-between items-end mb-12">
                                            <span className="text-sm font-bold text-gray-800">Tiến độ thực hiện chung</span>
                                            <span className="text-[#A31D1D] font-black text-lg">{progressPercent}%</span>
                                        </div>
                                        <div className="relative flex items-center justify-between w-full mt-2">
                                            {/* Dây nền xám */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>


                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#A31D1D] z-0 transition-all duration-500" style={{ width: `${getProgressBarWidth()}%` }}></div>


                                            <div className="z-10 flex flex-col items-center">
                                                <div className="w-6 h-6 rounded flex items-center justify-center mb-2 shadow-sm bg-[#A31D1D]"><CheckOutlined className="text-white text-xs font-bold" /></div>
                                                <span className="text-[10px] font-semibold text-gray-600">Đăng ký</span>
                                            </div>
                                            <div className="z-10 flex flex-col items-center">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center mb-2 shadow-sm transition-colors ${project.TrangThai !== 'CHODUYET' ? 'bg-[#A31D1D]' : 'bg-gray-100 border-gray-200'}`}>
                                                    {project.TrangThai !== 'CHODUYET' ? <CheckOutlined className="text-white text-xs font-bold" /> : <LockOutlined className="text-gray-400 text-[10px]" />}
                                                </div>
                                                <span className="text-[10px] font-semibold text-gray-400">Duyệt đề cương</span>
                                            </div>
                                            <div className="z-10 flex flex-col items-center">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center mb-2 shadow-sm transition-colors ${progressPercent >= 50 ? 'bg-[#A31D1D]' : (project.TrangThai === 'DANGTHUCHIEN' ? 'bg-white border-2 border-[#A31D1D]' : 'bg-gray-100 border-gray-200')}`}>
                                                    {progressPercent >= 50 ? <CheckOutlined className="text-white text-xs font-bold" /> : (project.TrangThai === 'DANGTHUCHIEN' ? <SyncOutlined spin className="text-[#A31D1D] text-[10px] font-bold" /> : <LockOutlined className="text-gray-400 text-[10px]" />)}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">Báo cáo giữa kỳ</span>
                                            </div>
                                            <div className="z-10 flex flex-col items-center">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center mb-2 shadow-sm transition-colors ${project.TrangThai === 'DANGHIEMTHU' ? 'bg-[#A31D1D]' : 'bg-gray-100 border-gray-200'}`}>
                                                    {project.TrangThai === 'DANGHIEMTHU' ? <CheckOutlined className="text-white text-xs font-bold" /> : <LockOutlined className="text-gray-400 text-[10px]" />}
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400">Nghiệm thu</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>


                        {project && (
                            <Card className="rounded-xl shadow-sm relative overflow-hidden" style={{ border: "1px solid #A31D1D4D" }}>
                                {project.TrangThai === 'CHODUYET' && (
                                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-6 text-center">
                                        <ExclamationCircleOutlined className="text-3xl text-orange-500 mb-2" />
                                        <h4 className="text-base font-bold text-gray-800">Đề tài đang chờ phê duyệt</h4>
                                        <p className="text-xs text-gray-500 mt-1">Khi nào giảng viên chấp nhận phê duyệt, hệ thống sẽ mở khóa nộp tài liệu.</p>
                                    </div>
                                )}


                                {/* KHU VỰC NỘP BÁO CÁO CUỐI KỲ */}
                                <Card className="rounded-xl shadow-sm relative overflow-hidden" style={{ border: "1px solid #A31D1D4D" }}>
                                    {/* Cảnh báo nếu đang chờ duyệt hoặc đã nghiệm thu */}
                                    {['CHODUYET', 'CHONGHIEMTHU', 'DANGHIEMTHU'].includes(project.TrangThai) && (
                                        <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-6 text-center">
                                            <ExclamationCircleOutlined className={`text-3xl mb-2 ${project.TrangThai === 'CHODUYET' ? 'text-orange-500' : 'text-green-500'}`} />
                                            <h4 className="text-base font-bold text-gray-800">
                                                {project.TrangThai === 'CHODUYET' ? 'Đề tài đang chờ phê duyệt' : 'Đề tài đã chốt sổ nộp bài'}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {project.TrangThai === 'CHODUYET' ? 'Khi nào giảng viên chấp nhận phê duyệt, hệ thống sẽ mở khóa nộp tài liệu.' : 'Báo cáo cuối kỳ đã được gửi đi thành công.'}
                                            </p>
                                        </div>
                                    )}


                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-50 p-2.5 rounded text-[#A31D1D]"><FileTextOutlined className="text-xl" /></div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">Nộp tài liệu báo cáo (Cuối kỳ)</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Sửa Dragger nối vào state finalFile */}
                                        <Dragger
                                            beforeUpload={(file) => { setFinalFile(file); return false; }}
                                            maxCount={1}
                                            onRemove={() => setFinalFile(null)}
                                            disabled={project.TrangThai !== 'DANGTHUCHIEN'}
                                            className="bg-gray-50/50 border-dashed border border-gray-300 rounded-lg p-4"
                                        >
                                            <p className="ant-upload-drag-icon text-[#A31D1D] mb-2"><InboxOutlined className="text-3xl" /></p>
                                            <p className="font-bold text-gray-800 text-sm">Kéo thả tệp hoặc click để chọn</p>
                                            {/* Hiện tên file nếu đã chọn */}
                                            {finalFile && <p className="text-green-600 font-bold mt-2 text-xs">Đã chọn: {finalFile.name}</p>}
                                        </Dragger>


                                        <div className="flex justify-between items-center mt-4">
                                            <Button className="bg-[#F6F4EB] text-[#7A6A42] font-bold text-xs"><RobotOutlined /> AI Trợ lý Đề tài</Button>


                                            {/* Nút NỘP BÀI gọi hàm handleFinalSubmit */}
                                            <Button
                                                onClick={handleFinalSubmit}
                                                loading={isSubmittingFinal}
                                                disabled={project.TrangThai !== 'DANGTHUCHIEN'}
                                                className="bg-[#A31D1D] text-white font-bold px-8 border-none"
                                            >
                                                CHỐT NỘP BÀI
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Card>
                        )}
                    </div>


                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 border border-[#A31D1D]/30 p-6 bg-white rounded-xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 border shadow-sm p-4 flex flex-col items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Điểm GVHD</span>
                                    <span className="text-3xl font-black text-[#A31D1D]">
                                        {/* 🌟 ĐỔI ĐOẠN NÀY LẠI: Tự động tìm báo cáo gần nhất đã được chấm điểm */}
                                        {progressList.find(p => p.DiemGVHD !== null && p.DiemGVHD !== undefined)?.DiemGVHD ?? '---'}
                                    </span>
                                </div>
                                <div className="bg-[#FFF5F5] border-red-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-[#A31D1D] uppercase">Trạng thái</span>
                                    <span className="text-xs font-black text-[#A31D1D] uppercase mt-1">
                                        {project ? (project.TrangThai_display || project.TrangThai) : 'CHƯA ĐĂNG KÝ'}
                                    </span>
                                </div>
                            </div>
                        </div>


                        <Card className="shadow-sm border-[#A31D1D] border-l-4">
                            <div className="flex items-center gap-2 mb-3 text-[#A31D1D] font-bold text-xs uppercase">
                                <MessageOutlined /> Nhận xét mới nhất
                            </div>
                            {progressList.filter(p => p.NhanXetGVHD).length > 0 ? (
                                <p className="text-sm text-gray-600 italic whitespace-pre-wrap">
                                    "{progressList.filter(p => p.NhanXetGVHD)[0].NhanXetGVHD}"
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic mb-4">Chưa có nhận xét nào từ giảng viên.</p>
                            )}
                        </Card>
                    </div>
                </div>
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Đăng ký Đề tài Nghiên cứu Khoa học</span>}
                    open={isRegisterModalVisible}
                    width={800}
                    onCancel={() => {
                        setIsRegisterModalVisible(false);
                        form.resetFields();
                        setSelectedTeam([]);
                    }}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleRegisterSubmit}
                        requiredMark={true}
                        size="large"
                        className="mt-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                label={<span className="font-bold text-gray-700">Mã đề tài (Dự kiến)</span>}
                                name="MaDeTai"
                                rules={[{ required: true, message: 'Vui lòng nhập mã đề tài!' }]}
                            >
                                <Input placeholder="VD: DT2026-001" />
                            </Form.Item>


                            <Form.Item
                                label={<span className="font-bold text-gray-700">Tên đề tài</span>}
                                name="TenDeTai"
                                rules={[{ required: true, message: 'Vui lòng nhập tên đề tài!' }]}
                            >
                                <Input placeholder="Nhập tên đề tài nghiên cứu..." />
                            </Form.Item>
                        </div>


                        <Form.Item
                            label={<span className="font-bold text-gray-700">Tóm tắt nội dung</span>}
                            name="TomTat"
                            rules={[{ required: true, message: 'Vui lòng nhập tóm tắt đề tài!' }]}
                        >
                            <TextArea rows={3} placeholder="Phân tích và thiết kế hệ thống tại Học viện Kỹ thuật Mật mã..." />
                        </Form.Item>


                        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block font-bold text-gray-700 mb-2 text-sm">
                                Thêm thành viên cùng nhóm (Tùy chọn)
                            </label>
                            <Select
                                showSearch
                                placeholder="Tìm bằng tên hoặc mã sinh viên để mời vào nhóm..."
                                value={null as any}
                                onSelect={handleAddStudent}
                                options={studentsOptions.filter(opt => !selectedTeam.some(s => s.MaSV === opt.value))}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                className="w-full mb-3"
                            />


                            {selectedTeam.length > 0 && (
                                <div className="flex flex-col gap-2 mt-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Thành viên đã chọn ({selectedTeam.length}/4)</p>
                                    {selectedTeam.map(sv => (
                                        <div key={sv.MaSV} className="flex justify-between items-center bg-white border border-gray-200 px-4 py-2 rounded-md shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Avatar icon={<UserOutlined />} className="bg-[#A31D1D]" />
                                                <div className="leading-tight">
                                                    <p className="font-bold text-gray-800 text-sm mb-0.5">{sv.TenSV}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{sv.MaSV} - Lớp: {sv.Lop}</p>
                                                </div>
                                            </div>
                                            <Button type="text" danger icon={<CloseOutlined />} onClick={() => handleRemoveStudent(sv.MaSV)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Form.Item name="DanhSachThanhVien" hidden><Input /></Form.Item>
                        </div>


                        <Form.Item
                            label={<span className="font-bold text-gray-700">Mời Giảng viên Hướng dẫn (Tùy chọn)</span>}
                            name="MaGV_HuongDan"
                        >
                            <Select
                                allowClear
                                showSearch
                                placeholder="Tìm kiếm giảng viên trong khoa..."
                                options={teachersOptions}
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            />
                        </Form.Item>


                        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-4">
                            <Button onClick={() => { setIsRegisterModalVisible(false); form.resetFields(); setSelectedTeam([]); }}>
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" loading={isRegistering} icon={<SaveOutlined />} className="bg-[#A31D1D] font-bold">
                                Lưu & Gửi phê duyệt
                            </Button>
                        </div>
                    </Form>
                </Modal>
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Nộp báo cáo tiến độ</span>}
                    open={isUploadModalVisible}
                    onCancel={() => setIsUploadModalVisible(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setIsUploadModalVisible(false)}>Hủy</Button>,
                        <Button key="submit" type="primary" loading={isSubmitting} onClick={handleUploadSubmit} className="bg-[#A31D1D] font-bold border-none">Nộp bài ngay</Button>
                    ]}
                >
                    <div className="py-4 flex flex-col gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wide">TỶ LỆ HOÀN THÀNH (%)</label>
                            <InputNumber min={0} max={100} value={newProgress} onChange={(value) => setNewProgress(value || 0)} className="w-full" size="large" formatter={(value) => `${value}%`} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wide">FILE BÁO CÁO</label>
                            <Upload beforeUpload={(file) => { setUploadFile(file); return false; }} maxCount={1} onRemove={() => setUploadFile(null)}>
                                <Button icon={<UploadOutlined />}>Bấm vào để chọn file</Button>
                            </Upload>
                        </div>
                    </div>
                </Modal>
            </div>
        </ConfigProvider>
    );
}



