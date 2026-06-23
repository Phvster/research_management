'tsx'
'use client';


import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Button, Spin, Typography, Tag, Popconfirm } from 'antd';
import { BellOutlined, CheckCircleOutlined, InfoCircleOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { sendRequest } from '@/utils/api';


const { Text } = Typography;


export default function NotificationHeader() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);


    // ================= KHẢO SÁT & TẢI THÔNG BÁO TỪ API =================
    const fetchNotifications = async () => {
        try {
            const res = await sendRequest<any>({ url: 'http://localhost:8000/api/thong-bao/', method: 'GET' });
            const list = res.results || res || [];
            setNotifications(list);
            // Tính số lượng tin chưa đọc
            setUnreadCount(list.filter((n: any) => !n.IsRead).length);
        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
        }
    };


    useEffect(() => {
        fetchNotifications();
        // Cơ chế Polling: Cứ 30 giây tự động quét thông báo mới một lần cho real-time
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDeleteNotification = async (maThongBao: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn không cho click nhầm vào dòng thông báo
        try {
            await sendRequest({
                url: `http://localhost:8000/api/thong-bao/${maThongBao}/`,
                method: 'DELETE'
            });
            // Cập nhật lại danh sách local (xóa item đó đi)
            setNotifications(prev => prev.filter((item: any) => item.MaThongBao !== maThongBao));
            setUnreadCount(prev => Math.max(0, prev - 1)); // Giảm số chấm đỏ nếu có
        } catch (error) {
            console.error("Lỗi xóa thông báo:", error);
        }
    };


    // Xóa tất cả thông báo
    const handleClearAll = async () => {
        try {
            await sendRequest({
                url: `http://localhost:8000/api/thong-bao/xoa-tat-ca/`,
                method: 'DELETE'
            });
            setNotifications([]); // Xóa trắng danh sách
            setUnreadCount(0);    // Tắt chấm đỏ
        } catch (error) {
            console.error("Lỗi dọn dẹp thông báo:", error);
        }
    };


    // ================= XỬ LÝ ĐỌC TIN NHẮN / ĐỌC HẾT =================
    const handleMarkAsRead = async (id: number) => {
        try {
            await sendRequest({
                url: `http://localhost:8000/api/thong-bao/${id}/`,
                method: 'PATCH',
                body: { IsRead: true }
            });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };


    const handleMarkAllRead = async () => {
        setLoading(true);
        try {
            await sendRequest({ url: 'http://localhost:8000/api/thong-bao/doc-het/', method: 'POST' });
            fetchNotifications();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    // Hàm chọn màu sắc dựa theo phân loại thông báo
    const getTagColor = (type: string) => {
        switch (type) {
            case 'TIENDO': return 'orange';
            case 'DETAI': return 'blue';
            case 'HOIDONG': return 'purple';
            default: return 'default';
        }
    };


    // ================= GIAO DIỆN DANH SÁCH THÔNG BÁO (POPOVER) =================
    const content = (
        <div className="w-[360px]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                <span className="font-black text-gray-800 text-xs uppercase tracking-wider">Thông báo của bạn</span>
                {unreadCount > 0 && (
                    <Button type="text" size="small" onClick={handleMarkAllRead} className="text-[#A31D1D] font-bold text-xs p-0 h-auto hover:bg-transparent">
                        Đọc tất cả
                    </Button>
                )}
                {notifications.length > 0 && (
                    <Popconfirm title="Xóa toàn bộ thông báo?" onConfirm={handleClearAll} okText="Xóa hết" cancelText="Hủy" okButtonProps={{ danger: true }}>
                        <Button type="text" size="small" danger icon={<ClearOutlined />} className="text-xs font-semibold">
                            Dọn dẹp
                        </Button>
                    </Popconfirm>)}

            </div>


            <Spin spinning={loading}>
                <List
                    dataSource={notifications}
                    locale={{ emptyText: <div className="py-6 text-center text-xs text-gray-400 italic">Bạn chưa có thông báo nào.</div> }}
                    className="max-h-[350px] overflow-y-auto pr-1"
                    renderItem={(item) => (
                        <div
                            key={item.MaThongBao}
                            onClick={() => !item.IsRead && handleMarkAsRead(item.MaThongBao)}
                            className={`p-3 rounded-lg mb-1.5 cursor-pointer transition-colors flex flex-col gap-1 border border-transparent ${item.IsRead ? 'bg-white hover:bg-gray-50' : 'bg-red-50/30 hover:bg-red-50/60 border-red-100/50'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <Tag color={getTagColor(item.Loai)} className="m-0 text-[9px] font-bold uppercase py-0 px-1.5 border-none">
                                    {item.Loai_display}
                                </Tag>
                                <span className="text-[10px] text-gray-400 font-medium">{item.NgayTao_display}</span>
                            </div>
                            <Text className={`text-xs leading-relaxed ${item.IsRead ? 'text-gray-500' : 'text-gray-800 font-bold'}`}>
                                {item.NoiDung}
                            </Text>
                        </div>
                    )}
                />
            </Spin>
        </div>
    );







    return (
        <Popover content={content} trigger="click" placement="bottomRight" arrow={{ pointAtCenter: true }}>
            <div className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative">
                <Badge count={unreadCount} size="small" offset={[2, -2]} color="#A31D1D">
                    <BellOutlined className="text-xl text-gray-600 hover:text-[#A31D1D] transition-colors" />
                </Badge>
            </div>
        </Popover>
    );
}


