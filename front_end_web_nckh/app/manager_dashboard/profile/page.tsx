'use client';

import React, { useState, useEffect } from 'react';
import SharedProfile from '@/components/shared/Profile';
import { BankOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { sendRequest } from '@/utils/api';

export default function ManagerProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();

    // ================= 1. GỌI API LẤY THÔNG TIN CÁ NHÂN =================
    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Gọi API lấy thông tin user đang đăng nhập
                const res = await sendRequest<any>({
                    url: 'http://localhost:8000/api/me/',
                    method: 'GET'
                });

                // Map dữ liệu từ Backend (Django) sang format của UI
                setProfile({
                    id: res.id,
                    name: res.TenHienThi || 'Cán bộ quản lý',
                    managerId: res.MaDinhDanh || 'N/A',
                    department: res.Khoa || 'Phòng Đào tạo & NCKH',
                    office: 'P.502 - Nhà TA', // Hardcode tạm nếu DB chưa có trường này
                    status: 'Đang công tác',
                    phone: res.SoDienThoai || '',
                    email: res.Email || res.username || '',
                    address: res.DiaChi || '',
                });
            } catch (error: any) {
                messageApi.error('Không tải được thông tin cá nhân: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // ================= 2. GỬI API CẬP NHẬT THÔNG TIN CÁ NHÂN =================
    const handleSave = async (values: any) => {
        try {
            // Mapping lại tên biến cho khớp với các field trong DB Django của ní
            await sendRequest({
                url: 'http://localhost:8000/api/me/', // Hoặc endpoint dùng để update profile
                method: 'PATCH',
                body: {
                    TenHienThi: values.name,
                    SoDienThoai: values.phone,
                    Email: values.email,
                    DiaChi: values.address,
                }
            });

            messageApi.success('Tuyệt vời! Cập nhật hồ sơ thành công.');

            // Cập nhật luôn State ở Frontend để giao diện đổi ngay mà không cần reload
            setProfile((prev: any) => ({
                ...prev,
                name: values.name,
                phone: values.phone,
                email: values.email,
                address: values.address
            }));

        } catch (error: any) {
            messageApi.error('Cập nhật thất bại: ' + error.message);
            throw error; // Throw lỗi để Component SharedProfile biết và tắt icon loading trên nút
        }
    };

    return (
        <>
            {contextHolder}
            <SharedProfile
                isLoading={loading}
                pageTitle="Hồ sơ cán bộ"
                pageSubtitle="Quản lý thông tin tài khoản và bảo mật của bạn tại Hệ thống NCKH Học viện."
                avatarUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop"
                fullName={profile?.name}
                idLabel="MÃ CB"
                idValue={profile?.managerId}
                initialFormValues={profile}
                onSave={handleSave}
                // Khai báo 3 cái box xám bên trái
                infoItems={[
                    { icon: <BankOutlined />, label: 'Đơn vị', value: profile?.department },
                    { icon: <EnvironmentOutlined />, label: 'Văn phòng', value: profile?.office },
                    { icon: <CheckCircleOutlined />, label: 'Trạng thái', value: profile?.status, valueColorClass: 'text-[#A31D1D]' },
                ]}
            />
        </>
    );
}