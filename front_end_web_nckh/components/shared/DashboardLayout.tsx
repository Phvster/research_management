'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Input, Avatar, Badge, ConfigProvider, Skeleton } from 'antd';
import {
    HomeOutlined,
    AppstoreOutlined,
    FolderOutlined,
    BookOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    SearchOutlined,
    TrophyOutlined,
    TeamOutlined,
    LineChartOutlined,
    CheckSquareOutlined,
    FileTextOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import NotificationHeader from '../notifications/NotificationHeader';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('currentUser');
            if (!token || !storedUser) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('currentUser');
                router.push('/login');
            } else {
                setUser(JSON.parse(storedUser));
                setIsCheckingAuth(false);
            }
        };
        checkAuth();
    }, [pathname, router]);
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        router.push('/login');
    };
    const studentMenu = [
        { icon: <HomeOutlined />, key: '/' },
        { icon: <AppstoreOutlined />, key: '/student_dashboard' },
        { icon: <TrophyOutlined />, key: '/student_dashboard/score' },
        { icon: <BookOutlined />, key: '/student_dashboard/library' },
        { icon: <UserOutlined />, key: '/student_dashboard/profile' },
    ];
    const teacherMenu = [
        { icon: <HomeOutlined />, key: '/' },
        { icon: <AppstoreOutlined />, key: '/teacher_dashboard' },
        { icon: <LineChartOutlined />, key: '/teacher_dashboard/stats' },
        { icon: <CheckSquareOutlined />, key: '/teacher_dashboard/approvals' },
        { icon: <UserOutlined />, key: '/teacher_dashboard/profile' },
    ];
    const managerMenu = [
        { icon: <HomeOutlined />, key: '/' },
        { icon: <AppstoreOutlined />, key: '/manager_dashboard' },
        { icon: <FileTextOutlined />, key: '/manager_dashboard/documents' },
        { icon: <TeamOutlined />, key: '/manager_dashboard/users' },
        { icon: <KeyOutlined />, key: '/manager_dashboard/system' },
        { icon: <UserOutlined />, key: '/manager_dashboard/profile' },
        { icon: <BookOutlined />, key: '/manager_dashboard/library' },
    ];

    const role = user?.QuyenHan;
    const currentMenu = role === 'QUANLY' ? managerMenu : (role === 'GIANGVIEN' ? teacherMenu : studentMenu);

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex bg-[#F8F9FA]">
                <div className="w-[55px] border-r border-gray-200 bg-white p-4">
                    <Skeleton.Avatar active size="small" shape="circle" className="mb-8" />
                    <Skeleton.Button active size="small" block className="mb-4" />
                    <Skeleton.Button active size="small" block className="mb-4" />
                </div>
                <div className="flex-1 p-8">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </div>
            </div>
        );
    }

    return (
        <ConfigProvider theme={{ token: { colorPrimary: '#A31D1D', fontFamily: 'inherit' } }}>
            <Layout className="min-h-screen bg-[#F8F9FA]">
                <Sider
                    width={55}
                    theme="light"
                    className="sticky top-0 z-50"
                    style={{ borderRight: 0, height: '100vh' }}
                >
                    <div className="flex flex-col h-full items-center py-6">
                        <div className="mb-10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
                            <img src="/logo-kma.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex flex-col gap-3 w-full items-center flex-1">
                            {currentMenu.map((item) => {
                                const exactMatchRoutes = ['/', '/student_dashboard', '/teacher_dashboard', '/manager_dashboard'];
                                const isActive = exactMatchRoutes.includes(item.key)
                                    ? pathname === item.key : pathname.startsWith(item.key);
                                return (
                                    <div
                                        key={item.key}
                                        onClick={() => router.push(item.key)}
                                        className="relative w-full flex justify-center items-center py-2 cursor-pointer group"
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#A31D1D] rounded-r-md"></div>
                                        )}
                                        <div className={`w-11 h-11 flex justify-center items-center rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-red-50 text-[#A31D1D] shadow-sm'
                                            : 'text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-700'
                                            }`}>
                                            <div className="text-[20px] leading-none">
                                                {item.icon}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-col gap-6 items-center text-gray-400 text-[20px] w-full mt-auto">
                            <div className="w-11 h-11 flex justify-center items-center rounded-xl hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-all">
                                <SettingOutlined />
                            </div>
                            <div
                                className="w-11 h-11 flex justify-center items-center rounded-xl hover:bg-red-50 hover:text-red-600 cursor-pointer transition-all"
                                onClick={handleLogout}
                            >
                                <LogoutOutlined />
                            </div>
                        </div>
                    </div>
                </Sider>
                <Layout>
                    <header
                        className="h-16 flex items-center justify-between sticky top-0 z-40 shadow-sm border-b border-gray-100"
                        style={{ backgroundColor: '#ffffff', padding: '0 24px' }}
                    >
                        <div className="flex items-center gap-2 font-bold text-sm shrink-0">
                            <span className="text-[#A31D1D] tracking-wide text-2xl font-extrabold">WORKSPACE</span>
                            <span className="text-red-400 text-1xl font-extralight">/</span>
                            <span className="text-red-800 text-1xl uppercase tracking-wide">
                                {user?.QuyenHan_display || 'Thành viên'}
                            </span>
                        </div>
                        <div className="flex-1 max-w-xl mx-8 hidden md:block">
                            <Input
                                prefix={<SearchOutlined className="text-gray-400 mr-2" />}
                                placeholder="Tìm kiếm đề tài, tài liệu..."
                                className="bg-gray-50 hover:bg-gray-100 border-transparent focus:border-[#A31D1D] rounded-lg h-10 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                            <NotificationHeader />
                            <div className="h-6 w-[1px] bg-gray-200"></div>

                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="text-right hidden sm:block whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#A31D1D] transition-colors">
                                        {user?.TenHienThi || 'Đang tải...'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        {user?.MaDinhDanh || 'ACTVN Member'}
                                    </div>
                                </div>
                                <Avatar
                                    src={role === 'GIANGVIEN' ? "https://i.pravatar.cc/150?img=8" : role === 'QUANLY' ? "https://i.pravatar.cc/150?img=1" : "https://i.pravatar.cc/150?img=11"}
                                    className="border border-gray-200 group-hover:border-[#A31D1D] transition-colors"
                                />
                            </div>
                        </div>
                    </header>
                    <Content className="p-6 md:p-8 min-h-screen border-l border-t border-[#A31D1D]/30">
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}