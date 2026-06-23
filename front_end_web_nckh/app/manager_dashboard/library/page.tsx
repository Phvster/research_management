'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Button, Pagination, Divider, Modal, Form, Input, Select,
    message, Spin, Popconfirm, Empty, Upload, Radio,
} from 'antd';
import {
    FilePdfFilled, FileWordFilled, BookFilled,
    PlusOutlined, EditOutlined, DeleteOutlined,
    ClockCircleOutlined, UploadOutlined, LinkOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { sendRequest } from '@/utils/api';

// ── Types khớp chính xác với backend ─────────────────────────────────────────
interface TaiLieuItem {
    MaTaiLieu: number;
    TenTaiLieu: string;
    MoTa: string;
    Loai: 'Biểu mẫu' | 'Quy định' | 'Hướng dẫn';
    DinhDang: 'Word' | 'PDF';
    DuongLink: string | null;
    FileDinhKem: string | null;
    NgayTao: string;
    NgayTao_display: string;
}

// ── Form values khi thêm / sửa ───────────────────────────────────────────────
interface FormValues {
    TenTaiLieu: string;
    MoTa: string;
    Loai: 'Biểu mẫu' | 'Quy định' | 'Hướng dẫn';
    DinhDang: 'Word' | 'PDF';
    uploadMode: 'link' | 'file';
    DuongLink?: string;
}

const FILTER_OPTIONS = ['Tất cả', 'Biểu mẫu', 'Quy định', 'Hướng dẫn'] as const;
const PAGE_SIZE = 12;
const BASE_URL = 'http://localhost:8000';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDownloadUrl(doc: TaiLieuItem): string | null {
    return doc.DuongLink || doc.FileDinhKem || null;
}

function renderFileIcon(dinhDang: string) {
    if (dinhDang === 'PDF')
        return <FilePdfFilled className="text-3xl" style={{ color: '#ff4d4f' }} />;
    if (dinhDang === 'Word')
        return <FileWordFilled className="text-3xl" style={{ color: '#1677ff' }} />;
    return <BookFilled className="text-3xl" style={{ color: '#52c41a' }} />;
}

function getCategoryStyle(loai: string) {
    switch (loai) {
        case 'Quy định': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'Biểu mẫu': return 'bg-pink-50 text-pink-700 border border-pink-200';
        case 'Hướng dẫn': return 'bg-green-50 text-green-700 border border-green-200';
        default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
}

// ── Component chính ───────────────────────────────────────────────────────────
export default function ManagerLibraryPage() {
    const [documents, setDocuments] = useState<TaiLieuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [messageApi, contextHolder] = message.useMessage();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDoc, setEditingDoc] = useState<TaiLieuItem | null>(null);
    const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm<FormValues>();

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await sendRequest<any>({
                url: `${BASE_URL}/api/tai-lieu/`,
                method: 'GET',
            });
            const raw: TaiLieuItem[] = res?.results ?? res ?? [];
            setDocuments(raw);
        } catch {
            messageApi.error('Lỗi kết nối — không thể tải danh sách tài liệu.');
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    // ── Lọc + tìm kiếm ───────────────────────────────────────────────────────
    const filteredDocs = documents.filter(doc => {
        const matchCat = activeFilter === 'Tất cả' || doc.Loai === activeFilter;
        const matchSearch = !searchText
            || doc.TenTaiLieu.toLowerCase().includes(searchText.toLowerCase())
            || doc.MoTa.toLowerCase().includes(searchText.toLowerCase());
        return matchCat && matchSearch;
    });

    const pagedDocs = filteredDocs.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const handleFilterChange = (f: string) => { setActiveFilter(f); setCurrentPage(1); };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value); setCurrentPage(1);
    };

    // ── Mở Modal ──────────────────────────────────────────────────────────────
    const handleOpenModal = (doc?: TaiLieuItem) => {
        if (doc) {
            setEditingDoc(doc);
            const mode = doc.DuongLink ? 'link' : 'file';
            setUploadMode(mode);
            form.setFieldsValue({
                TenTaiLieu: doc.TenTaiLieu,
                MoTa: doc.MoTa,
                Loai: doc.Loai,
                DinhDang: doc.DinhDang,
                uploadMode: mode,
                DuongLink: doc.DuongLink ?? '',
            });
            // Nếu đang có file đính kèm thì show thumbnail
            if (doc.FileDinhKem) {
                setFileList([{
                    uid: '-1',
                    name: doc.FileDinhKem.split('/').pop() ?? 'file',
                    status: 'done',
                    url: doc.FileDinhKem,
                }]);
            } else {
                setFileList([]);
            }
        } else {
            setEditingDoc(null);
            setUploadMode('link');
            setFileList([]);
            form.resetFields();
            form.setFieldsValue({ uploadMode: 'link', DinhDang: 'PDF' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
        setFileList([]);
        setEditingDoc(null);
    };

    // ── Submit (tạo mới hoặc cập nhật) ───────────────────────────────────────
    const handleFormSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            // Luôn dùng FormData để hỗ trợ cả 2 chế độ: link và file upload
            const formData = new FormData();
            formData.append('TenTaiLieu', values.TenTaiLieu);
            formData.append('MoTa', values.MoTa || '');
            formData.append('Loai', values.Loai);
            formData.append('DinhDang', values.DinhDang);

            if (values.uploadMode === 'link') {
                formData.append('DuongLink', values.DuongLink || '');
                // Xóa file nếu user chuyển sang link
            } else {
                // Lấy file thực từ fileList (originFileObj)
                const rawFile = fileList[0]?.originFileObj;
                if (rawFile) {
                    formData.append('FileDinhKem', rawFile);
                } else if (!editingDoc?.FileDinhKem) {
                    // Tạo mới nhưng không có file
                    messageApi.warning('Vui lòng chọn file cần tải lên.');
                    setIsSubmitting(false);
                    return;
                }
                formData.append('DuongLink', '');
            }

            const isEdit = !!editingDoc;
            const url = isEdit
                ? `${BASE_URL}/api/tai-lieu/${editingDoc!.MaTaiLieu}/`
                : `${BASE_URL}/api/tai-lieu/`;

            // Gọi fetch trực tiếp vì sendRequest có thể không hỗ trợ FormData
            const token = typeof window !== 'undefined'
                ? localStorage.getItem('accessToken')
                : null;

            const resp = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const errMsg = Object.values(errData).flat().join(' ') || 'Lỗi không xác định.';
                throw new Error(errMsg);
            }

            messageApi.success(isEdit ? 'Cập nhật tài liệu thành công!' : 'Đã đăng tải tài liệu mới lên thư viện!');
            handleCloseModal();
            fetchDocuments();
        } catch (err: any) {
            messageApi.error(err?.message || 'Thao tác thất bại. Kiểm tra lại kết nối.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Xóa ──────────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        try {
            await sendRequest({
                url: `${BASE_URL}/api/tai-lieu/${id}/`,
                method: 'DELETE',
            });
            messageApi.success('Đã gỡ tài liệu khỏi thư viện.');
            // Nếu xóa xong trang hiện tại trống → về trang trước
            const remaining = filteredDocs.length - 1;
            const maxPage = Math.ceil(remaining / PAGE_SIZE) || 1;
            if (currentPage > maxPage) setCurrentPage(maxPage);
            fetchDocuments();
        } catch {
            messageApi.error('Xóa thất bại. Vui lòng thử lại.');
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-[1400px] mx-auto pb-12">
            {contextHolder}

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-5 mb-8 pb-6 border-b border-red-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">Quản lý Thư viện văn bản</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Đăng tải biểu mẫu, hướng dẫn và quy chế nghiên cứu khoa học cho toàn bộ sinh viên.
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    className="font-bold h-10 px-5 rounded-lg shadow-sm"
                    style={{ backgroundColor: '#A31D1D', borderColor: '#A31D1D' }}
                >
                    Đăng tài liệu mới
                </Button>
            </div>

            {/* ── BỘ LỌC + TÌM KIẾM ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
                <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.map(f => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeFilter === f
                                ? 'bg-[#A31D1D] text-white shadow-sm'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {f}
                            {f !== 'Tất cả' && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    ({documents.filter(d => d.Loai === f).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Tìm tài liệu..."
                        value={searchText}
                        onChange={handleSearch}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#A31D1D] focus:ring-1 focus:ring-[#A31D1D]/20 transition-all"
                    />
                </div>
            </div>

            {/* ── Thống kê nhanh ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
                {[
                    { label: 'Tổng tài liệu', value: documents.length, color: 'text-gray-800' },
                    { label: 'Biểu mẫu', value: documents.filter(d => d.Loai === 'Biểu mẫu').length, color: 'text-pink-600' },
                    { label: 'Quy định', value: documents.filter(d => d.Loai === 'Quy định').length, color: 'text-amber-600' },
                    { label: 'Hướng dẫn', value: documents.filter(d => d.Loai === 'Hướng dẫn').length, color: 'text-green-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-lg border border-gray-100 px-4 py-3 text-center shadow-sm">
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── LƯỚI TÀI LIỆU ───────────────────────────────────────────── */}
            {pagedDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
                    {pagedDocs.map(doc => {
                        const downloadUrl = getDownloadUrl(doc);
                        return (
                            <div
                                key={doc.MaTaiLieu}
                                className="bg-white rounded-xl border border-gray-200 hover:border-red-200 hover:shadow-md transition-all duration-200 flex flex-col p-5 group"
                            >
                                {/* Icon + Nút thao tác */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        {renderFileIcon(doc.DinhDang)}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleOpenModal(doc)}
                                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                        />
                                        <Popconfirm
                                            title="Xóa tài liệu này?"
                                            description="Hành động này không thể hoàn tác."
                                            onConfirm={() => handleDelete(doc.MaTaiLieu)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                </div>

                                {/* Nội dung */}
                                <div className="flex-1 min-h-0">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${getCategoryStyle(doc.Loai)} inline-block mb-2`}>
                                        {doc.Loai}
                                    </span>
                                    <h3 className="text-sm font-bold text-gray-800 mb-1.5 leading-snug line-clamp-2 group-hover:text-[#A31D1D] transition-colors">
                                        {doc.TenTaiLieu}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                                        {doc.MoTa || 'Không có mô tả.'}
                                    </p>
                                </div>

                                <Divider className="my-3" style={{ borderColor: '#f0f0f0', margin: '12px 0' }} />

                                {/* Footer */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 flex items-center gap-1 font-medium">
                                        <ClockCircleOutlined />
                                        {doc.NgayTao_display}
                                    </span>
                                    {downloadUrl ? (
                                        <a
                                            href={downloadUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[#A31D1D] font-bold flex items-center gap-1 hover:underline"
                                        >
                                            Xem file
                                        </a>
                                    ) : (
                                        <span className="text-gray-300 italic">Chưa có file</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-24">
                    <Empty
                        description={
                            <span className="text-gray-400 font-medium">
                                {searchText
                                    ? `Không tìm thấy tài liệu khớp với "${searchText}"`
                                    : 'Chưa có tài liệu nào. Bấm "Đăng tài liệu mới" để bắt đầu.'}
                            </span>
                        }
                    />
                </div>
            )}

            {/* ── PHÂN TRANG ──────────────────────────────────────────────── */}
            {filteredDocs.length > PAGE_SIZE && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        current={currentPage}
                        onChange={setCurrentPage}
                        total={filteredDocs.length}
                        pageSize={PAGE_SIZE}
                        showSizeChanger={false}
                        showTotal={total => `${total} tài liệu`}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                MODAL THÊM / SỬA TÀI LIỆU
            ══════════════════════════════════════════════════════════════ */}
            <Modal
                title={
                    <span className="font-black text-lg text-[#A31D1D]">
                        {editingDoc ? 'Cập nhật tài liệu' : 'Đăng tải tài liệu mới'}
                    </span>
                }
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={560}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    size="large"
                    className="mt-4"
                    initialValues={{ uploadMode: 'link', DinhDang: 'PDF' }}
                >
                    {/* Tên tài liệu */}
                    <Form.Item
                        label={<span className="font-semibold text-gray-700">Tiêu đề tài liệu</span>}
                        name="TenTaiLieu"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input placeholder="VD: Quy chế Quản lý Nghiên cứu Khoa học Sinh viên…" />
                    </Form.Item>

                    {/* Mô tả */}
                    <Form.Item
                        label={<span className="font-semibold text-gray-700">Mô tả tóm tắt</span>}
                        name="MoTa"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Trình bày ngắn gọn mục đích và nội dung cốt lõi của tài liệu…"
                        />
                    </Form.Item>

                    {/* Loại + Định dạng */}
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            label={<span className="font-semibold text-gray-700">Danh mục</span>}
                            name="Loai"
                            rules={[{ required: true, message: 'Chọn danh mục!' }]}
                        >
                            <Select placeholder="Chọn danh mục">
                                <Select.Option value="Biểu mẫu">Biểu mẫu</Select.Option>
                                <Select.Option value="Quy định">Quy định</Select.Option>
                                <Select.Option value="Hướng dẫn">Hướng dẫn</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span className="font-semibold text-gray-700">Định dạng file</span>}
                            name="DinhDang"
                            rules={[{ required: true, message: 'Chọn định dạng!' }]}
                        >
                            <Select placeholder="Định dạng">
                                <Select.Option value="PDF">PDF (.pdf)</Select.Option>
                                <Select.Option value="Word">Word (.docx)</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    {/* Chọn cách cung cấp file: link hoặc upload */}
                    <Form.Item
                        label={<span className="font-semibold text-gray-700">Cách cung cấp file</span>}
                        name="uploadMode"
                    >
                        <Radio.Group
                            value={uploadMode}
                            onChange={e => {
                                setUploadMode(e.target.value);
                                form.setFieldValue('uploadMode', e.target.value);
                            }}
                            className="flex gap-4"
                        >
                            <Radio value="link">
                                <span className="flex items-center gap-1.5">
                                    <LinkOutlined /> Dán đường dẫn (Google Drive, OneDrive…)
                                </span>
                            </Radio>
                            <Radio value="file">
                                <span className="flex items-center gap-1.5">
                                    <UploadOutlined /> Tải file lên server
                                </span>
                            </Radio>
                        </Radio.Group>
                    </Form.Item>

                    {/* Chế độ link */}
                    {uploadMode === 'link' && (
                        <Form.Item
                            label={<span className="font-semibold text-gray-700">Đường dẫn tải file</span>}
                            name="DuongLink"
                            rules={[
                                { required: true, message: 'Nhập đường dẫn file!' },
                                { type: 'url', message: 'Đường dẫn không hợp lệ (phải bắt đầu bằng https://)' },
                            ]}
                        >
                            <Input placeholder="https://drive.google.com/file/d/…" prefix={<LinkOutlined className="text-gray-400" />} />
                        </Form.Item>
                    )}

                    {/* Chế độ upload file */}
                    {uploadMode === 'file' && (
                        <Form.Item
                            label={<span className="font-semibold text-gray-700">Chọn file tải lên</span>}
                            required
                            help="Chấp nhận .pdf, .doc, .docx — tối đa 20 MB"
                        >
                            <Upload
                                fileList={fileList}
                                beforeUpload={() => false}          // Ngăn tự upload, để form kiểm soát
                                accept=".pdf,.doc,.docx"
                                maxCount={1}
                                onChange={({ fileList: newList }) => setFileList(newList)}
                                onRemove={() => setFileList([])}
                            >
                                {fileList.length === 0 && (
                                    <Button icon={<UploadOutlined />} className="w-full">
                                        Chọn file từ máy tính…
                                    </Button>
                                )}
                            </Upload>
                        </Form.Item>
                    )}

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmitting}
                            style={{ backgroundColor: '#A31D1D', borderColor: '#A31D1D' }}
                            className="font-bold"
                        >
                            {editingDoc ? 'Lưu thay đổi' : 'Đăng tải'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
