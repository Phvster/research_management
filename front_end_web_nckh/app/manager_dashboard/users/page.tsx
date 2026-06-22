'use client';


import React, { useState, useEffect } from 'react';
import { Button, Pagination, message, Skeleton, ConfigProvider, Modal, Form, Input, Select, Tag, List, Empty, Avatar } from 'antd';
import {
    PlusOutlined,
    TeamOutlined,
    CalendarOutlined,
    FileTextOutlined,
    UserOutlined,
    EyeOutlined,
    SettingOutlined,
    FileProtectOutlined,
    LinkOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';


const HOI_DONG_ROLES = [
    { key: 'Chủ tịch hội đồng', label: 'Chủ tịch hội đồng' },
    { key: 'Thư ký hội đồng', label: 'Thư ký hội đồng' },
    { key: 'Ủy viên phản biện 1', label: 'Ủy viên phản biện 1' },
    { key: 'Ủy viên phản biện 2', label: 'Ủy viên phản biện 2' },
    { key: 'Ủy viên hội đồng', label: 'Ủy viên hội đồng' },
];


export default function ManagerCouncilsPage() {
    const [loading, setLoading] = useState(true);
    const [councils, setCouncils] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [messageApi, contextHolder] = message.useMessage();


    // States cho Tạo Hội đồng
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();
    const formValues = Form.useWatch([], form);


    // States cho Phân công Báo cáo
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [selectedCouncil, setSelectedCouncil] = useState<any>(null);
    const [pendingProjects, setPendingProjects] = useState<any[]>([]);
    const [isAssigning, setIsAssigning] = useState<string | null>(null);


    // State cho Modal hiển thị Thành viên Hội đồng
    const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [councilsRes, teachersRes] = await Promise.all([
                sendRequest<any>({ url: 'http://localhost:8000/api/hoi-dong/', method: 'GET' }),
                sendRequest<any>({ url: 'http://localhost:8000/api/giang-vien/', method: 'GET' })
            ]);
            setCouncils(councilsRes.results || councilsRes || []);
            setTeachers(teachersRes.results || teachersRes || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu mạng:", error);
            messageApi.warning("Đang hiển thị dữ liệu giả lập do lỗi kết nối API.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);


    // ================= 1. HÀM TẠO HỘI ĐỒNG =================
    const handleCreateCouncil = async (values: any) => {
        setIsSubmitting(true);
        try {
            const danhSachThanhVien = HOI_DONG_ROLES.map(role => ({
                MaGV: values[`role_${role.key}`],
                VaiTro: role.key
            }));


            const payload = {
                MaHoiDong: values.MaHoiDong,
                TenHoiDong: values.TenHoiDong,
                QuyetDinh: values.QuyetDinh,
                DanhSachThanhVien: danhSachThanhVien
            };


            await sendRequest({
                url: 'http://localhost:8000/api/hoi-dong/',
                method: 'POST',
                body: payload
            });


            messageApi.success('Lên lịch hội đồng và phân công thành viên thành công! 🎉');
            setIsCreateModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error: any) {
            messageApi.error(error.message || 'Không thể tạo hội đồng. Kiểm tra lại ràng buộc dữ liệu.');
        } finally {
            setIsSubmitting(false);
        }
    };


    // ================= HÀM XÓA HỘI ĐỒNG (KÈM POPUP CONFIRM) =================
    const handleDeleteCouncil = async (maHoiDong: string) => {
        Modal.confirm({
            title: <span className="text-red-600 font-black">Xác nhận giải tán Hội đồng</span>,
            icon: <DeleteOutlined className="text-red-500" />,
            content: `Bạn có chắc chắn muốn xóa hoàn toàn Hội đồng [${maHoiDong}] khỏi hệ thống không? Hành động này không thể hoàn tác.`,
            okText: 'Xóa ngay',
            okType: 'danger',
            cancelText: 'Hủy bỏ',
            centered: true,
            onOk: async () => {
                try {
                    await sendRequest({
                        url: `http://localhost:8000/api/hoi-dong/${maHoiDong}/`,
                        method: 'DELETE'
                    });
                    messageApi.success(`Đã xóa Hội đồng ${maHoiDong} thành công!`);
                    fetchData(); // Reload lưới danh sách
                } catch (error: any) {
                    messageApi.error(error.message || 'Xóa hội đồng thất bại.');
                }
            }
        });
    };


    // ================= 2. HÀM MỞ MODAL & LẤY BÁO CÁO CHỜ NGHIỆM THU =================
    const openAssignModal = async (council: any) => {
        setSelectedCouncil(council);
        setIsAssignModalVisible(true);
        try {
            const res = await sendRequest<any>({
                url: 'http://localhost:8000/api/bao-cao/',
                method: 'GET'
            });
            // Lọc báo cáo chưa có hội đồng chấm và Đề tài liên quan đang ở trạng thái CHONGHIEMTHU
            const availableReports = (res.results || res || []).filter((p: any) =>
                !p.MaHoiDong && p.de_tai_info?.TrangThai === 'CHONGHIEMTHU'
            );
            setPendingProjects(availableReports);
        } catch (error) {
            messageApi.error("Không thể lấy danh sách báo cáo chờ nghiệm thu.");
        }
    };


    // ================= 3. HÀM THỰC THI PHÂN CÔNG BÁO CÁO =================
    const handleAssignProject = async (maBaoCao: string) => {
        setIsAssigning(maBaoCao);
        try {
            await sendRequest({
                url: `http://localhost:8000/api/bao-cao/${maBaoCao}/phan-cong-hoi-dong/`,
                method: 'PATCH',
                body: { MaHoiDong: selectedCouncil.MaHoiDong }
            });


            messageApi.success(`Đã gán báo cáo ${maBaoCao} cho Hội đồng ${selectedCouncil.MaHoiDong} chấm!`);

            // BIẾN MẤT LẬP TỨC: Xóa báo cáo vừa gán ra khỏi danh sách hiển thị trong Modal ngay lập tức
            setPendingProjects(prev => prev.filter(p => p.MaBaoCao !== maBaoCao));

            const newCouncilsRes = await sendRequest<any>({ url: 'http://localhost:8000/api/hoi-dong/', method: 'GET' });
            const newCouncils = newCouncilsRes.results || newCouncilsRes || []; setCouncils(newCouncils); // Cập nhật selectedCouncil với data mới nhất const updatedCouncil = newCouncils.find((c: any) => c.MaHoiDong === selectedCouncil.MaHoiDong); if (updatedCouncil) setSelectedCouncil(updatedCouncil); 

        } catch (error: any) {
            const errorMsg = error.message || '';


            // 🌟 NẾU LÀ LỖI XUNG ĐỘT LỢI ÍCH -> BẬT MODAL CẢNH BÁO ĐỎ
            if (errorMsg.toLowerCase().includes('vi phạm quy chế') || errorMsg.toLowerCase().includes('hướng dẫn')) {
                Modal.error({
                    title: <span className="text-[#A31D1D] font-black text-lg">Phát hiện xung đột lợi ích!</span>,
                    content: (
                        <div className="mt-3">
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                                <p className="font-bold text-gray-800 m-0 leading-relaxed text-sm">{errorMsg}</p>
                            </div>
                            <p className="text-[11px] text-gray-500 italic mt-2">
                                * Theo quy định, để đảm bảo tính minh bạch, Giảng viên hướng dẫn không được phép tham gia chấm điểm báo cáo của chính sinh viên mình. Vui lòng chọn Hội đồng khác!
                            </p>
                        </div>
                    ),
                    okText: 'Đã hiểu & Chọn HĐ khác',
                    okButtonProps: { danger: true, className: 'font-bold' },
                    centered: true,
                });
            } else {
                // Các lỗi thông thường khác thì chỉ hiện Toast
                messageApi.error(errorMsg || 'Lỗi phân công hội đồng.');
            }
        } finally {
            setIsAssigning(null);
        }
    };


    const totalCouncils = councils.length;
    const totalDecisions = councils.filter(c => c.QuyetDinh).length;
    const currentData = councils.slice((currentPage - 1) * pageSize, currentPage * pageSize);


    if (loading) return <div className="p-8 max-w-[1400px] mx-auto"><Skeleton active paragraph={{ rows: 12 }} /></div>;


    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D' } }}>
            <div className="max-w-[1400px] mx-auto pb-10 flex flex-col gap-8">
                {contextHolder}


                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Quản lý Hội đồng Nghiệm thu</h1>
                        <p className="text-gray-500 text-sm">
                            Thành lập hội đồng, gán quyết định và phân công đề tài để cán bộ chấm điểm.
                        </p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)} className="font-bold bg-[#A31D1D] border-none h-10 px-5 rounded-lg">
                        Tạo hội đồng mới
                    </Button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="bg-red-50 p-4 rounded-xl text-[#A31D1D] text-2xl"><TeamOutlined /></div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng số hội đồng</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">{totalCouncils}</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="bg-amber-50 p-4 rounded-xl text-amber-600 text-2xl"><FileProtectOutlined /></div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số quyết định gốc</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">{totalDecisions}</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl text-blue-600 text-2xl"><CalendarOutlined /></div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Đợt nghiệm thu</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">2026.1</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl text-gray-500 text-2xl"><FileTextOutlined /></div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mẫu phiếu đánh giá</div>
                            <div className="text-2xl font-black text-gray-900 leading-none">Thang điểm 10</div>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentData.map((council, index) => (
                        <div key={council.MaHoiDong || index} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col border-t-4 border-t-[#A31D1D] overflow-hidden hover:shadow-md transition-all">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-black text-gray-800">{council.MaHoiDong}</h2>
                                    <div className="flex items-center gap-2">
                                        {/* NÚT XÓA HỘI ĐỒNG ĐÃ ĐƯỢC THÊM */}
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteCouncil(council.MaHoiDong)}
                                            className="hover:bg-red-50 flex items-center justify-center"
                                        />
                                        <Tag className="font-bold border-none px-2.5 py-0.5 text-[9px] bg-red-50 text-[#A31D1D] uppercase rounded-full">
                                            Hội đồng KMA
                                        </Tag>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-[#A31D1D] uppercase tracking-wider mb-6 line-clamp-1">
                                    {council.TenHoiDong}
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <FileProtectOutlined className="text-gray-400 text-lg" />
                                        <span>Quyết định: <strong className="font-semibold text-gray-800">{council.QuyetDinh || 'Chưa cập nhật'}</strong></span>
                                    </div>
                                    <div className="flex items-start gap-3 mt-3">
                                        <div className="bg-white p-2 rounded-md shadow-sm text-gray-400 text-lg"><FileTextOutlined /></div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Đề tài đang chấm</div>
                                            {council.danh_sach_de_tai?.length > 0 ? (
                                                <div className="flex flex-col gap-1.5">
                                                    {council.danh_sach_de_tai.map((dt: any) => (
                                                        <div key={dt.MaDeTai} className="bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                                                            <div className="text-[10px] font-mono text-[#A31D1D] font-bold">{dt.MaDeTai}</div>
                                                            <div className="text-xs text-gray-700 font-medium line-clamp-1">{dt.TenDeTai}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Chưa có đề tài nào được phân công</span>
                                            )}
                                        </div>
                                    </div>




                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3 mt-auto">
                                <Button
                                    icon={<SettingOutlined />}
                                    className="font-bold text-[#A31D1D] border-[#A31D1D] h-10 rounded-lg hover:bg-red-50"
                                    onClick={() => {
                                        setSelectedCouncil(council);
                                        setIsMembersModalVisible(true);
                                    }}
                                >
                                    Thành viên
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    className="font-bold bg-[#A31D1D] border-none h-10 rounded-lg shadow-sm"
                                    onClick={() => openAssignModal(council)}
                                >
                                    Đề tài chấm
                                </Button>
                            </div>
                        </div>
                    ))}


                    {(currentPage * pageSize >= councils.length) && (
                        <div onClick={() => setIsCreateModalVisible(true)} className="bg-red-50/10 rounded-xl border-2 border-dashed border-[#A31D1D]/30 min-h-[250px] flex flex-col justify-center items-center cursor-pointer hover:bg-red-50/40 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-full border border-gray-100 flex items-center justify-center text-[#A31D1D] text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300"><PlusOutlined /></div>
                            <span className="font-black text-gray-800 text-base">Lên lịch hội đồng</span>
                        </div>
                    )}
                </div>


                {councils.length > pageSize && (
                    <div className="flex justify-center mt-6">
                        <Pagination current={currentPage} onChange={(page) => setCurrentPage(page)} total={councils.length} pageSize={pageSize} showSizeChanger={false} />
                    </div>
                )}


                {/* MODAL TẠO HỘI ĐỒNG */}
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Lên lịch Thành lập Hội đồng mới</span>}
                    open={isCreateModalVisible}
                    onCancel={() => {
                        setIsCreateModalVisible(false);
                        form.resetFields();
                    }}
                    width={700}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={handleCreateCouncil} size="large" className="mt-4">
                        <div className="p-4 bg-gray-50 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-100">
                            <Form.Item label={<span className="font-bold text-xs text-gray-600 uppercase">Mã Hội đồng</span>} name="MaHoiDong" rules={[{ required: true, message: 'Bắt buộc!' }]}>
                                <Input placeholder="VD: HD-CNTT-01" className="text-sm rounded-lg" />
                            </Form.Item>
                            <Form.Item label={<span className="font-bold text-xs text-gray-600 uppercase">Tên lĩnh vực hội đồng</span>} name="TenHoiDong" rules={[{ required: true, message: 'Bắt buộc!' }]}>
                                <Input placeholder="VD: Hội đồng CNTT" className="text-sm rounded-lg" />
                            </Form.Item>
                            <Form.Item label={<span className="font-bold text-xs text-gray-600 uppercase">Số Quyết định</span>} name="QuyetDinh" rules={[{ required: true, message: 'Bắt buộc!' }]}>
                                <Input placeholder="VD: QĐ-245/QĐ-HVM" className="text-sm rounded-lg" />
                            </Form.Item>
                        </div>


                        <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                            <TeamOutlined className="text-[#A31D1D]" /> Cơ cấu 05 cán bộ thành viên (Bắt buộc)
                        </h3>


                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                            {HOI_DONG_ROLES.map((role) => {
                                const otherSelectedGvs = HOI_DONG_ROLES
                                    .filter(r => r.key !== role.key)
                                    .map(r => formValues?.[`role_${r.key}`])
                                    .filter(Boolean);


                                const availableTeachers = teachers.filter(t => !otherSelectedGvs.includes(t.MaGV));


                                return (
                                    <div key={role.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-b border-gray-100 pb-3">
                                        <div className="font-bold text-gray-700 text-sm md:col-span-1">
                                            {role.label} <span className="text-red-500">*</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Form.Item name={`role_${role.key}`} rules={[{ required: true, message: `Hãy chỉ định ${role.label}!` }]} className="mb-0">
                                                <Select
                                                    placeholder={`Chọn giảng viên đảm nhiệm ${role.label}`}
                                                    className="w-full text-sm"
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    options={availableTeachers.map(t => ({
                                                        value: t.MaGV,
                                                        label: `[${t.MaGV}] ${t.HocHamHocVi || ''} ${t.TenGV}`
                                                    }))}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button onClick={() => { setIsCreateModalVisible(false); form.resetFields(); }}>Hủy bỏ</Button>
                            <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-[#A31D1D] font-bold border-none px-6">
                                Thành lập hội đồng
                            </Button>
                        </div>
                    </Form>
                </Modal>


                {/* MODAL PHÂN CÔNG BÁO CÁO (ĐÃ ĐƯỢC CHUYỂN ĐỔI CHUẨN TỪ ĐỀ TÀI SANG BÁO CÁO) */}
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Phân công báo cáo cho Hội đồng {selectedCouncil?.MaHoiDong}</span>}
                    open={isAssignModalVisible}
                    onCancel={() => setIsAssignModalVisible(false)}
                    width={700}
                    footer={[
                        <Button key="close" onClick={() => setIsAssignModalVisible(false)}>Đóng</Button>
                    ]}
                >
                    <div className="bg-red-50/50 p-4 rounded-lg mb-4 border border-red-100">
                        <p className="text-sm text-gray-700 m-0">
                            Danh sách dưới đây là các <strong className="text-[#A31D1D]">Báo cáo Nghiệm thu</strong> Sinh viên đã nộp. Hãy gán chúng vào hội đồng này để các thầy cô tiến hành chấm điểm.
                        </p>
                    </div>


                    <List
                        className="demo-loadmore-list"
                        loading={false}
                        itemLayout="horizontal"
                        dataSource={pendingProjects}
                        locale={{ emptyText: <Empty description="Hiện không có báo cáo nào đang chờ nghiệm thu hoặc tất cả đã được phân công." /> }}
                        renderItem={(item) => (
                            <List.Item
                                className="bg-white border border-gray-100 mb-3 rounded-lg p-4 shadow-sm hover:border-red-200 transition-colors"
                                actions={[
                                    <Button
                                        type="primary"
                                        key="assign"
                                        icon={<LinkOutlined />}
                                        loading={isAssigning === item.MaBaoCao}
                                        onClick={() => handleAssignProject(item.MaBaoCao)}
                                        className="bg-[#A31D1D] border-none font-bold"
                                    >
                                        Gán cho HĐ này
                                    </Button>
                                ]}
                            >
                                <Skeleton avatar title={false} loading={false} active>
                                    <List.Item.Meta
                                        title={<span className="font-bold text-gray-800 text-base">{item.MaBaoCao} - Đề tài: "{item.de_tai_info?.TenDeTai}"</span>}
                                        description={
                                            <div className="mt-1 flex flex-col gap-1">
                                                <span className="text-xs text-gray-500">Giảng viên hướng dẫn: <strong className="text-gray-700">{item.de_tai_info?.gv_huong_dan || 'Chưa rõ'}</strong></span>
                                                <span className="text-xs text-gray-500">Nhóm sinh viên / Chủ nhiệm: <strong className="text-gray-700">{item.de_tai_info?.chu_nhiem || 'Chưa cập nhật'}</strong></span>
                                            </div>
                                        }
                                    />
                                </Skeleton>
                            </List.Item>
                        )}
                    />
                </Modal>


                {/* MODAL XEM CHI TIẾT THÀNH VIÊN TRONG HỘI ĐỒNG */}
                <Modal
                    title={<span className="font-black text-lg text-[#A31D1D]">Danh sách Thành viên Hội đồng {selectedCouncil?.MaHoiDong}</span>}
                    open={isMembersModalVisible}
                    onCancel={() => setIsMembersModalVisible(false)}
                    footer={[<Button key="close" onClick={() => setIsMembersModalVisible(false)}>Đóng</Button>]}
                    centered
                    width={550}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={selectedCouncil?.DanhSachThanhVien || []}
                        locale={{ emptyText: <Empty description="Hội đồng này hiện chưa phân công thành viên đảm nhiệm chức vụ." /> }}
                        renderItem={(member: any) => {
                            // Ưu tiên dùng data gộp sẵn từ backend, nếu không có mới tìm trong mảng teachers
                            const tenGV = member.giang_vien_info
                                ? `${member.giang_vien_info.HocHamHocVi || ''} ${member.giang_vien_info.TenGV}`
                                : `Giảng viên (${member.MaGV})`;

                            return (
                                <List.Item className="py-3 px-1">
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} className="bg-[#A31D1D]" />}
                                        title={<span className="font-bold text-gray-800 text-sm">{tenGV}</span>}
                                        description={<span className="text-xs text-gray-400 font-mono">Mã số: {member.MaGV}</span>}
                                    />
                                    <Tag color="red" className="font-bold px-3 py-0.5 border-none rounded uppercase text-[10px]">
                                        {/* Hiển thị vai trò (Tùy theo Backend gửi về VaiTro hay VaiTroHD) */}
                                        {member.VaiTroHD || member.VaiTro || 'Ủy viên'}
                                    </Tag>
                                </List.Item>
                            );
                        }}
                    />
                </Modal>
            </div>
        </ConfigProvider>
    );
}