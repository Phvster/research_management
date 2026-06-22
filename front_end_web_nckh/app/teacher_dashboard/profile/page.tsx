'use client';

import React, { useState, useEffect } from 'react';
import SharedProfile from '@/components/shared/Profile';
import { BankOutlined, EnvironmentOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';

export default function TeacherProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lấy data API (Giả lập)
        setTimeout(() => {
            setProfile({
                id: 'GV-001',
                name: 'TS. Lê Văn A',
                teacherId: 'GV20240015',
                faculty: 'Công nghệ thông tin',
                office: 'P.502 - Nhà TB1',
                status: 'Đang công tác',
                achievements: 'Hướng dẫn 12+ đề tài NCKH, đạt 04 giải thưởng cấp Học viện.',
                phone: '0987 654 321',
                email: 'levana@actvn.edu.vn',
                address: '141 Chiến Thắng, Tân Triều, Thanh Trì, Hà Nội',
            });
            setLoading(false);
        }, 800);
    }, []);

    const handleSave = async (values: any) => {
        console.log('Call API Update Giảng viên:', values);
        return new Promise<void>(resolve => setTimeout(resolve, 1000));
    };

    return (
        <SharedProfile
            isLoading={loading}
            pageTitle="Hồ sơ cá nhân"
            pageSubtitle="Quản lý thông tin tài khoản và bảo mật của bạn tại ACTVN Research."
            avatarUrl="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop"
            fullName={profile?.name}
            idLabel="MÃ CB"
            idValue={profile?.teacherId}
            initialFormValues={profile}
            onSave={handleSave}
            // Khai báo 3 cái box xám bên trái
            infoItems={[
                { icon: <BankOutlined />, label: 'Khoa', value: profile?.faculty },
                { icon: <EnvironmentOutlined />, label: 'Văn phòng', value: profile?.office },
                { icon: <CheckCircleOutlined />, label: 'Trạng thái', value: profile?.status, valueColorClass: 'text-[#A31D1D]' },
            ]}
            // Khai báo box vàng
            achievement={{
                icon: <TrophyOutlined />,
                label: 'Thành tích nghiên cứu',
                content: profile?.achievements,
            }}
        />
    );
}