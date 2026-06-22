'use client';

import React, { useState, useEffect } from 'react';
import { Button, Pagination, Divider, Modal, Form, Input, Select, message, Spin, Popconfirm } from 'antd';
import {
    FilePdfFilled,
    FileWordFilled,
    BookFilled,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { sendRequest } from '@/utils/api';

interface DocumentItem {
    id: string;
    title: string;
    description: string;
    category: 'Quy định' | 'Biểu mẫu' | 'Hướng dẫn';
    fileType: 'pdf' | 'doc' | 'book';
    updatedAt: string;
    FileLink?: string;
}

export default function ManagerLibraryPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [messageApi, contextHolder] = message.useMessage();

    // States xử lý Modal Form (Dùng chung cho cả Thêm và Sửa)
    const [isModalOpen, setIsModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
    const [form] = Form.useForm();

    const filters = ['Tất cả', 'Biểu mẫu', 'Quy định', 'Hướng dẫn'];

    // ================= 1. TẢI DANH SÁCH TÀI LIỆU =================
    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await sendRequest<any>({ url: 'http://localhost:8000/api/tai-lieu/', method: 'GET' });
            const rawData = res.results || res || [];
            const mappedData = rawData.map((item: any) => ({
                id: item.id || item.MaTaiLieu,
                title: item.title || item.TenTaiLieu,
                description: item.description || item.TomTat || item.NoiDung,
                category: item.category || item.LoaiTaiLieu,
                fileType: item.fileType || item.DinhDangFile || 'pdf',
                updatedAt: item.updatedAt || (item.NgayCapNhat ? new Date(item.NgayCapNhat).toLocaleDateString('vi-VN') : 'Vừa xong'),
                FileLink: item.FileLink || ''
            }));
            setDocuments(mappedData);
        } catch (error) {
            messageApi.error("Lỗi khi kết nối lấy danh sách tài liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // ================= 2. THAO TÁC THÊM HOẶC SỬA TÀI LIỆU =================
    const handleOpenModal = (doc?: DocumentItem) => {
        if (doc) {
            setEditingDoc(doc);
            form.setFieldsValue(doc); // Đổ dữ liệu cũ vào ô input để sửa
        } else {
            setEditingDoc(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleFormSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            const payload = {
                TenTaiLieu: values.title,
                TomTat: values.description,
                LoaiTaiLieu: values.category,
                DinhDangFile: values.fileType,
                FileLink: values.FileLink
            };

            if (editingDoc) {
                // Lệnh PATCH sửa tài liệu cũ
                await sendRequest({
                    url: `http://localhost:8000/api/tai-lieu/${editingDoc.id}/`,
                    method: 'PATCH',
                    body: payload
                });
                messageApi.success('Đã cập nhật chỉnh sửa tài liệu thành công!');
            } else {
                // Lệnh POST tạo tài liệu mới
                await sendRequest({
                    url: 'http://localhost:8000/api/tai-lieu/',
                    method: 'POST',
                    body: payload
                });
                messageApi.success('Đã đăng tải tài liệu văn bản mới lên thư viện!');
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchDocuments(); // Refresh lại danh sách
        } catch (error) {
            messageApi.error('Giao tác thất bại, kiểm tra lại kết nối cơ sở dữ liệu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================= 3. THAO TÁC XÓA TÀI LIỆU =================
    const handleDeleteDoc = async (id: string) => {
        try {
            await sendRequest({
                url: `http://localhost:8000/api/tai-lieu/${id}/`,
                method: 'DELETE'
            });
            messageApi.success('Đã gỡ bỏ văn bản tài liệu khỏi thư viện hệ thống.');
            fetchDocuments();
        } catch (error) {
            messageApi.error('Xóa tài liệu thất bại.');
        }
    };

    const filteredDocs = activeFilter === 'Tất cả' ? documents : documents.filter(doc => doc.category === activeFilter);
    const renderFileIcon = (type: string) => {
        if (type === 'pdf') return <FilePdfFilled className="text-3xl" style={{ color: '#ff4d4f' }} />;
        if (type === 'doc' || type === 'docx') return <FileWordFilled className="text-3xl" style={{ color: '#1677ff' }} />;
        return <BookFilled className="text-3xl" style={{ color: '#52c41a' }} />;
    };

    if (loading) return <div className="p-10 text-center"><Spin size="large" className="mt-20" /></div>;

    return (
        <div className="max-w-[1400px] mx-auto pb-10">
            {contextHolder}

            {/* ================= HEADER CONTROL ================= */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6 border-b border-[#A31D1D]/30 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">Quản lý Thư viện văn bản</h1>
                    <p className="text-gray-500 text-sm">Công cụ đăng tải biểu mẫu, hướng dẫn học vụ và quy chế nghiên cứu khoa học cho toàn bộ sinh viên.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => (
                            <button key={filter} onClick={() => { setActiveFilter(filter); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === filter ? 'bg-[#A31D1D] text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{filter}</button>
                        ))}
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="font-bold bg-[#A31D1D] border-none h-10 px-5 rounded-lg shadow-sm">Đăng tài liệu mới</Button>
                </div>
            </div>

            {/* ================= LƯỚI THẺ HỘI ĐỒNG / TÀI LIỆU QUẢN TRỊ ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-xl border border-gray-200 flex flex-col p-5 group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">{renderFileIcon(doc.fileType)}</div>
                            {/* Cụm nút Thao tác nhanh (Sửa, Xóa) lồng trực tiếp trên Card */}
                            <div className="flex gap-2">
                                <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(doc)} className="border-gray-200 text-blue-600" />
                                <Popconfirm title="Xác nhận xóa tài liệu này?" onConfirm={() => handleDeleteDoc(doc.id)} okText="Xóa luôn" cancelText="Hủy">
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-800 mb-2 leading-snug line-clamp-2">{doc.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{doc.description}</p>
                        </div>
                        <Divider className="my-4" style={{ borderColor: '#f0f0f0' }} />
                        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1.5"><ClockCircleOutlined /> {doc.updatedAt}</span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{doc.category}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= MODAL: FORM THÊM / SỬA TÀI LIỆU ================= */}
            <Modal
                title={<span className="font-black text-lg text-[#A31D1D]">{editingDoc ? 'Cập nhật tài liệu' : 'Đăng tải tài liệu mới'}</span>}
                open={isModalOpen}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} size="large" className="mt-4">
                    <Form.Item label={<span className="font-bold text-gray-700">Tiêu đề tài liệu văn bản</span>} name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề văn bản!' }]}>
                        <Input placeholder="VD: Quy chế Quản lý Nghiên cứu Khoa học Sinh viên..." />
                    </Form.Item>

                    <Form.Item label={<span className="font-bold text-gray-700">Mô tả tóm tắt nội dung</span>} name="description" rules={[{ required: true, message: 'Nhập mô tả!' }]}>
                        <Input.TextArea rows={3} placeholder="Trình bày ngắn gọn mục đích và nội dung cốt lõi của tài liệu..." />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label={<span className="font-bold text-gray-700">Danh mục phân loại</span>} name="category" rules={[{ required: true }]}>
                            <Select placeholder="Chọn danh mục">
                                <Select.Option value="Biểu mẫu">Biểu mẫu</Select.Option>
                                <Select.Option value="Quy định">Quy định</Select.Option>
                                <Select.Option value="Hướng dẫn">Hướng dẫn</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label={<span className="font-bold text-gray-700">Định dạng hiển thị tệp</span>} name="fileType" rules={[{ required: true }]}>
                            <Select placeholder="Định dạng file">
                                <Select.Option value="pdf">Tệp tin PDF (.pdf)</Select.Option>
                                <Select.Option value="doc">Tệp văn bản Word (.docx)</Select.Option>
                                <Select.Option value="book">Tệp Sách điện tử / Hướng dẫn</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item label={<span className="font-bold text-gray-700">Đường dẫn tải file về (URL tệp mẫu)</span>} name="FileLink" rules={[{ required: true, message: 'Vui lòng chèn link file mẫu!' }]}>
                        <Input placeholder="Dán link drive hoặc link lưu trữ file biểu mẫu..." />
                    </Form.Item>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                        <Button onClick={() => setIsModalVisible(false)}>Hủy bỏ</Button>
                        <Button type="primary" htmlType="submit" loading={isSubmitting} className="bg-[#A31D1D] border-none font-bold">Lưu cấu trúc</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}