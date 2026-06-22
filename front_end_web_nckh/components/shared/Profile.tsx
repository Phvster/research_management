'use client';

import React, { useState } from 'react';
import { Card, Input, Button, Divider, Form, Skeleton, message } from 'antd';
import {
    PhoneOutlined, MailOutlined, LockOutlined, EnvironmentOutlined,
    FormOutlined, SafetyCertificateFilled, SaveOutlined
} from '@ant-design/icons';

// Định nghĩa các cổng kết nối (Props)
export interface SharedProfileProps {
    isLoading: boolean;
    pageTitle: string;           // VD: "Hồ sơ cá nhân"
    pageSubtitle: string;        // VD: "Quản lý thông tin tài khoản..."
    avatarUrl: string;
    fullName: string;            // VD: "TS. Lê Văn A"
    idLabel: string;             // VD: "MSSV" hoặc "Mã CB"
    idValue: string;             // VD: "GV20240015"
    infoItems: {                 // Mảng chứa 3 cái box xám bên trái
        icon: React.ReactNode;
        label: string;
        value: string;
        valueColorClass?: string; // Class màu cho text (VD: 'text-[#A31D1D]')
    }[];
    achievement?: {               // Box màu vàng
        icon: React.ReactNode;
        label: string;
        content: string;
    };
    initialFormValues: any;      // Dữ liệu đổ vào Form
    onSave: (values: any) => Promise<void>;
}

export default function SharedProfile(props: SharedProfileProps) {
    const {
        isLoading, pageTitle, pageSubtitle, avatarUrl, fullName,
        idLabel, idValue, infoItems, achievement, initialFormValues, onSave
    } = props;

    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleFinish = async (values: any) => {
        setSaving(true);
        try {
            await onSave(values);
            messageApi.success('Đã cập nhật thông tin tài khoản thành công!');
        } catch (error) {
            messageApi.error('Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !initialFormValues) {
        return <div className="p-10"><Skeleton active avatar paragraph={{ rows: 8 }} /></div>;
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-10">
            {contextHolder}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 mb-1">{pageTitle}</h1>
                <p className="text-gray-500 text-sm">{pageSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ================= CỘT TRÁI (GIỮ NGUYÊN CODE CỦA NÍ) ================= */}
                <div className="lg:col-span-1">
                    <Card
                        className="rounded-xl shadow-sm overflow-hidden"
                        styles={{ body: { padding: 0 }, }}
                        style={{ border: "1px solid #A31D1D4D" }}
                    >
                        <div className="h-28 bg-[#FFF5F5]"></div>

                        <div className="px-6 pb-6">
                            <div className="-mt-14 mb-4">
                                <img src={avatarUrl} alt="Avatar" className="w-28 h-28 rounded-2xl border-4 border-white shadow-md object-cover bg-white" />
                            </div>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
                                <p className="text-[#A31D1D] font-bold text-sm mt-1">{idLabel}: {idValue}</p>
                            </div>

                            {/* Render danh sách Box Xám */}
                            <div className="space-y-3">
                                {infoItems.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                                        <div className="text-[#A31D1D] text-lg mt-0.5">{item.icon}</div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</div>
                                            <div className={`text-sm font-bold ${item.valueColorClass || 'text-gray-800'}`}>
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Render Box Vàng (Thành tích) */}
                            {achievement && (
                                <div className="bg-[#FFFBE6] border border-[#FFE58F] rounded-lg p-4 mt-6 flex items-start gap-3">
                                    <div className="text-[#D48806] text-lg mt-0.5">{achievement.icon}</div>
                                    <div>
                                        <div className="text-[10px] font-bold text-[#D48806] uppercase tracking-wider mb-1">{achievement.label}</div>
                                        <div className="text-sm font-medium text-gray-800">{achievement.content}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* ================= CỘT PHẢI (GIỮ NGUYÊN CODE CỦA NÍ) ================= */}
                <div className="lg:col-span-2 space-y-8">
                    <Card
                        className="rounded-xl shadow-sm"
                        styles={{ body: { padding: '32px' } }}
                        style={{ border: "1px solid #A31D1D4D" }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <FormOutlined className="text-[#A31D1D] text-xl" />
                            <h2 className="text-xl font-bold text-gray-800">Cập nhật thông tin tài khoản</h2>
                        </div>

                        <Divider className="my-6" />

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleFinish}
                            initialValues={initialFormValues}
                        >
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                    <Form.Item
                                        name="phone"
                                        label={<span className="text-xs font-bold text-gray-600">Số điện thoại</span>}
                                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                                    >
                                        <Input size="large" prefix={<PhoneOutlined className="text-gray-400 mr-2" />} className="bg-gray-50 rounded-lg font-medium text-gray-700 hover:border-[#A31D1D] focus:border-[#A31D1D]" />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        label={<span className="text-xs font-bold text-gray-600">Email liên hệ</span>}
                                        rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
                                    >
                                        <Input size="large" prefix={<MailOutlined className="text-gray-400 mr-2" />} className="bg-gray-50 rounded-lg font-medium text-gray-700 hover:border-[#A31D1D] focus:border-[#A31D1D]" />
                                    </Form.Item>
                                </div>

                                <Form.Item
                                    name="password"
                                    label={<span className="text-xs font-bold text-gray-600">Đổi mật khẩu</span>}
                                >
                                    <Input.Password size="large" prefix={<LockOutlined className="text-gray-400 mr-2" />} placeholder="Nhập mật khẩu mới (để trống nếu không đổi)" className="bg-gray-50 rounded-lg hover:border-[#A31D1D] focus:border-[#A31D1D]" />
                                </Form.Item>

                                <Form.Item
                                    name="address"
                                    label={<span className="text-xs font-bold text-gray-600">Địa chỉ thường trú</span>}
                                >
                                    <Input size="large" prefix={<EnvironmentOutlined className="text-gray-400 mr-2" />} className="bg-gray-50 rounded-lg font-medium text-gray-700 hover:border-[#A31D1D] focus:border-[#A31D1D]" />
                                </Form.Item>
                            </div>

                            <Divider className="my-8" />

                            <div className="flex justify-end gap-4 mb-8">
                                <Button className="font-bold text-[#A31D1D] border-[#A31D1D] rounded-lg h-10 px-8 hover:bg-red-50" onClick={() => form.resetFields()}>
                                    Hủy bỏ
                                </Button>
                                <Button htmlType="submit" loading={saving} type="primary" icon={<SaveOutlined />} className="bg-[#A31D1D] text-white font-bold rounded-lg h-10 px-8 border-none shadow-md hover:opacity-90">
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </Form>

                        <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start">
                            <div className="bg-red-100 p-3 rounded-xl">
                                <SafetyCertificateFilled className="text-[#A31D1D] text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">Bảo mật tài khoản</h3>
                                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                    Lần cuối thay đổi mật khẩu là 3 tháng trước. Chúng tôi khuyên bạn nên cập nhật mật khẩu định kỳ để bảo vệ dữ liệu nghiên cứu.
                                </p>
                                <a href="#" className="text-[#A31D1D] font-bold text-sm hover:underline flex items-center gap-1">
                                    Kích hoạt xác thực 2 lớp (2FA) →
                                </a>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}