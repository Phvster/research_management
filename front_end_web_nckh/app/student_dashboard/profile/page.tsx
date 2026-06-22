'use client';

import React, { useState, useEffect } from 'react';
import SharedProfile from '@/components/shared/Profile';
import { BookOutlined, EnvironmentOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';

export default function StudentProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Giả lập gọi API lấy thông tin sinh viên
        setTimeout(() => {
            setProfile({
                id: 'USER-001',
                name: 'Nguyễn Văn Nam',
                studentId: '12345678',
                class: 'AT18 - An toàn thông tin',
                department: 'An toàn thông tin',
                status: 'Đang theo học',
                achievements: 'Đạt 01 giải thưởng cấp Học viện.',
                phone: '0987 654 321',
                email: 'anv.at16d@actvn.edu.vn',
                address: '141 Chiến Thắng, Tân Triều, Thanh Trì, Hà Nội',
            });
            setLoading(false);
        }, 800);
    }, []);

    const handleSave = async (values: any) => {
        console.log('Dữ liệu chuẩn bị gửi lên API (Sinh viên):', values);
        return new Promise<void>(resolve => setTimeout(resolve, 1000));
    };

    return (
        <SharedProfile
            isLoading={loading}
            pageTitle="Hồ sơ cá nhân"
            pageSubtitle="Quản lý thông tin tài khoản và bảo mật của bạn tại ACTVN Research."
            avatarUrl="https://i.pravatar.cc/150?img=11"
            fullName={profile?.name}
            idLabel="MSSV"
            idValue={profile?.studentId}
            initialFormValues={profile}
            onSave={handleSave}
            // Khai báo 3 cái box xám bên trái cho Sinh viên (Lớp, Khoa, Trạng thái)
            infoItems={[
                { icon: <BookOutlined />, label: 'Lớp', value: profile?.class },
                { icon: <EnvironmentOutlined />, label: 'Khoa', value: profile?.department },
                { icon: <CheckCircleOutlined />, label: 'Trạng thái', value: profile?.status, valueColorClass: 'text-[#A31D1D]' },
            ]}
            // Khai báo box vàng (Thành tích)
            achievement={{
                icon: <TrophyOutlined />,
                label: 'Thành tích nghiên cứu',
                content: profile?.achievements,
            }}
        />
    );
}