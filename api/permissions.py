# api/permissions.py

from rest_framework.permissions import BasePermission
from .models import TaiKhoan, SinhVien


# ─── Hàm tiện ích nội bộ ──────────────────────────────────────────────────────
def _lay_quyen_han(user) -> str | None:
    """
    Tra cứu QuyenHan từ bảng TaiKhoan theo username đang đăng nhập.
    Trả về: 'SINHVIEN' | 'GIANGVIEN' | 'QUANLY' | None
    """
    try:
        return TaiKhoan.objects.get(TenDangNhap=user.username).QuyenHan
    except TaiKhoan.DoesNotExist:
        return None


def _lay_sinh_vien(user):
    """Trả về object SinhVien của user, hoặc None nếu không tìm thấy."""
    try:
        return SinhVien.objects.select_related("MaDeTai").get(
            TenDangNhap__TenDangNhap=user.username
        )
    except SinhVien.DoesNotExist:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# 1. IsCanBoQuanLy
# Dùng cho: Duyệt đề tài, Thành lập hội đồng, Phân công hướng dẫn,
#           Quản lý tài khoản, Xem toàn bộ báo cáo
# ═══════════════════════════════════════════════════════════════════════════════
class IsCanBoQuanLy(BasePermission):
    """
    Chỉ tài khoản có QuyenHan = 'QUANLY' mới được phép.
    Áp dụng ở VIEW-LEVEL: toàn bộ request đến view này đều kiểm tra.
    """
    message = "Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền Cán bộ Quản lý."

    def has_permission(self, request, view) -> bool:
        # Bước 1: Phải đăng nhập (authenticated) đã
        if not request.user or not request.user.is_authenticated:
            return False
        # Bước 2: Kiểm tra vai trò trong bảng TaiKhoan
        return _lay_quyen_han(request.user) == TaiKhoan.QuyenHanChoices.QUAN_LY


# ═══════════════════════════════════════════════════════════════════════════════
# 2. IsGiangVien
# Dùng cho: Xem đề tài được phân công, Đánh giá tiến độ sinh viên,
#           Xác nhận nhận hướng dẫn
# ═══════════════════════════════════════════════════════════════════════════════
class IsGiangVien(BasePermission):
    """
    Chỉ tài khoản có QuyenHan = 'GIANGVIEN' mới được phép.
    """
    message = "Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền Giảng viên."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _lay_quyen_han(request.user) == TaiKhoan.QuyenHanChoices.GIANG_VIEN


# ═══════════════════════════════════════════════════════════════════════════════
# 3. IsSinhVien
# Dùng cho: Đăng ký đề tài, Cập nhật tiến độ, Nộp báo cáo
# ═══════════════════════════════════════════════════════════════════════════════
class IsSinhVien(BasePermission):
    """
    Chỉ tài khoản có QuyenHan = 'SINHVIEN' mới được phép.
    """
    message = "Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền Sinh viên."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _lay_quyen_han(request.user) == TaiKhoan.QuyenHanChoices.SINH_VIEN


# ═══════════════════════════════════════════════════════════════════════════════
# 4. IsCanBoOrReadOnly
# Dùng cho: Các endpoint mà mọi người được XEM nhưng chỉ QUANLY được SỬA/XÓA
# Ví dụ: Danh sách đề tài (GET công khai), nhưng PATCH/DELETE chỉ QUANLY
# ═══════════════════════════════════════════════════════════════════════════════
class IsCanBoOrReadOnly(BasePermission):
    """
    - GET / HEAD / OPTIONS → Mọi user đã đăng nhập đều được phép
    - POST / PUT / PATCH / DELETE → Chỉ QUANLY

    Dùng kết hợp với IsAuthenticated trong permission_classes.
    """
    message = "Thao tác ghi chỉ dành cho Cán bộ Quản lý."

    SAFE_METHODS = ("GET", "HEAD", "OPTIONS")

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        # Đọc → cho phép mọi người
        if request.method in self.SAFE_METHODS:
            return True
        # Ghi → chỉ QUANLY
        return _lay_quyen_han(request.user) == TaiKhoan.QuyenHanChoices.QUAN_LY


# ═══════════════════════════════════════════════════════════════════════════════
# 5. IsSinhVienDungNhom  ← OBJECT-LEVEL PERMISSION
# Đây là permission quan trọng nhất: kiểm tra ở cấp độ từng object cụ thể.
# Sinh viên chỉ được thao tác trên dữ liệu thuộc đề tài của chính mình.
# ═══════════════════════════════════════════════════════════════════════════════
class IsSinhVienDungNhom(BasePermission):
    """
    Object-level permission cho Sinh viên.

    Cơ chế hoạt động:
    ┌─────────────────────────────────────────────────────────────┐
    │  has_permission()  → Kiểm tra request-level (đã là SV?)    │
    │  has_object_permission() → Kiểm tra object-level           │
    │                            (SV này có sở hữu object đó?)   │
    └─────────────────────────────────────────────────────────────┘

    DRF gọi has_object_permission() SAU has_permission() và chỉ khi
    view gọi self.get_object() (tức là các action: retrieve, update,
    partial_update, destroy).

    Áp dụng cho: TienDo, BaoCao — object phải thuộc đề tài của SV đó.
    """
    message = "Bạn chỉ có quyền thao tác trên dữ liệu thuộc đề tài của chính mình."

    def has_permission(self, request, view) -> bool:
        """Kiểm tra cấp request: user phải là Sinh viên đã đăng nhập."""
        if not request.user or not request.user.is_authenticated:
            return False
        return _lay_quyen_han(request.user) == TaiKhoan.QuyenHanChoices.SINH_VIEN

    def has_object_permission(self, request, view, obj) -> bool:
        """
        Kiểm tra cấp object: object phải thuộc đề tài của sinh viên đang đăng nhập.

        Hàm này nhận `obj` là instance Model cụ thể (TienDo, BaoCao...).
        Kiểm tra obj.MaDeTai có trùng với MaDeTai của sinh viên không.
        """
        sinh_vien = _lay_sinh_vien(request.user)

        # Nếu không tìm thấy hồ sơ SV hoặc SV chưa có đề tài → từ chối
        if sinh_vien is None or sinh_vien.MaDeTai is None:
            return False

        # Lấy MaDeTai từ object (TienDo / BaoCao đều có trường MaDeTai)
        # hasattr để đảm bảo an toàn nếu model khác không có trường này
        if not hasattr(obj, "MaDeTai"):
            return False

        # So sánh MaDeTai của object với MaDeTai của sinh viên đang đăng nhập
        return obj.MaDeTai_id == sinh_vien.MaDeTai_id


# ═══════════════════════════════════════════════════════════════════════════════
# 6. IsOwnerOrCanBo — Kết hợp: chủ sở hữu HOẶC quản lý
# Dùng cho: SinhVien xem hồ sơ của mình; CanBo xem tất cả
# ═══════════════════════════════════════════════════════════════════════════════
class IsOwnerOrCanBo(BasePermission):
    """
    Cho phép truy cập nếu:
    - User là QUANLY (xem/sửa tất cả), HOẶC
    - User là chủ sở hữu của object (SinhVien/GiangVien xem hồ sơ mình)
    """
    message = "Bạn chỉ có thể xem/sửa thông tin của chính mình."

    def has_permission(self, request, view) -> bool:
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj) -> bool:
        quyen_han = _lay_quyen_han(request.user)

        # QUANLY được phép tất cả
        if quyen_han == TaiKhoan.QuyenHanChoices.QUAN_LY:
            return True

        # Với SinhVien/GiangVien: kiểm tra object có phải của họ không
        # obj ở đây là SinhVien hoặc GiangVien instance
        if hasattr(obj, "TenDangNhap"):
            return obj.TenDangNhap.TenDangNhap == request.user.username

        return False
    

from rest_framework.permissions import BasePermission

class AllowAllAuthenticatedActions(BasePermission):
    """
    Quyền cho phép TẤT CẢ người dùng đã đăng nhập 
    thực hiện BẤT KỲ hành động nào trên hệ thống.
    """
    def has_permission(self, request, view):
        # Chỉ cần tài khoản đã đăng nhập hợp lệ (có token) là cho qua hết
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Cho phép sửa/xóa bất kỳ bản ghi nào của người khác luôn
        return True