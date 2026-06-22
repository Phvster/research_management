'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendRequest } from '@/utils/api';

interface ILoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: 'QUANLY' | 'GIANGVIEN' | 'SINHVIEN' | string;
        [key: string]: any;
    };
}

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const tokenData = await sendRequest<any>({
                url: 'http://localhost:8000/api/auth/token/',
                method: 'POST',
                body: {
                    username: values.email,
                    password: values.password,
                },
            });
            localStorage.setItem('accessToken', tokenData.access);
            localStorage.setItem('refreshToken', tokenData.refresh);
            const userData = await sendRequest<any>({
                url: 'http://localhost:8000/api/me/',
                method: 'GET',
            });
            localStorage.setItem('currentUser', JSON.stringify(userData));
            messageApi.success('Đăng nhập thành công!');
            const userRole = userData.QuyenHan;
            if (userRole === 'QUANLY') {
                router.push('/manager_dashboard');
            } else if (userRole === 'GIANGVIEN') {
                router.push('/teacher_dashboard');
            } else if (userRole === 'SINHVIEN') {
                router.push('/student_dashboard');
            } else {
                messageApi.error('Lỗi phân quyền hệ thống. Vui lòng liên hệ Admin!');
            }

        } catch (error: any) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            messageApi.error(error.message || 'Sai tài khoản hoặc mật khẩu!');
        } finally {
            setLoading(false);
        }
    };
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#A31D1D',
                }
            }}
        >
            <div className="min-h-screen bg-gray-50 flex flex-col relative py-8">
                {contextHolder}
                <div className="absolute top-6 left-6 lg:top-10 lg:left-10">
                    <Link href="/" className="text-gray-500 hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
                        <ArrowLeftOutlined /> Quay lại Trang chủ
                    </Link>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-4 w-full">
                    <div className="w-full max-w-[480px] bg-white px-8 pt-10 pb-8 rounded-2xl border border-red-200">
                        <div className="text-center mb-8">
                            <img src="/logo-kma.png" alt="Logo KMA" className="h-20 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-primary mb-2">Đăng nhập Hệ thống</h1>
                            <p className="text-gray-500 text-sm">
                                Quản lý nghiên cứu khoa học sinh viên<br />ACTVN Research
                            </p>
                        </div>
                        <Form
                            name="login"
                            layout="vertical"
                            onFinish={onFinish}
                            size="large"
                            requiredMark={false}
                        >
                            <Form.Item
                                label={<span className="text-sm font-bold text-gray-700">Tên đăng nhập hoặc Email</span>}
                                name="email"
                                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email!' }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập tên đăng nhập hoặc email"
                                    className="py-2.5"
                                />
                            </Form.Item>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-sm font-bold text-gray-700">Mật khẩu</label>
                                <a href="#" className="text-sm font-semibold text-primary hover:text-primary-hover">
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                                className="mb-4"
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập mật khẩu của bạn"
                                    className="py-2.5"
                                />
                            </Form.Item>
                            <Form.Item name="remember" valuePropName="checked" className="mb-6">
                                <Checkbox className="text-gray-600 font-medium">Ghi nhớ đăng nhập</Checkbox>
                            </Form.Item>
                            <Form.Item className="mb-6">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="w-full h-12 text-base font-bold shadow-md flex justify-center items-center gap-2"
                                    loading={loading}
                                >
                                    Đăng nhập <LoginOutlined />
                                </Button>
                            </Form.Item>

                            <div className="text-center text-sm text-gray-500">
                                Chưa có tài khoản? <a href="#" className="text-primary font-medium hover:underline">Liên hệ Quản trị viên</a>
                            </div>
                        </Form>
                    </div>
                </div>
                <div className="text-center pb-4 text-xs text-gray-400 font-medium leading-relaxed">
                    © 2026 Học viện Kỹ thuật Mật mã (ACTVN).<br />
                    Phiên bản hệ thống: 1.1.0
                </div>
            </div>
        </ConfigProvider>
    );
}