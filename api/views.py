# api/views.py  (chỉ hiển thị phần thêm mới/thay đổi so với bước trước)

from django.utils     import timezone
from django.db.models import Avg
from django.shortcuts  import get_object_or_404

from rest_framework                import viewsets, status, filters
from rest_framework.decorators     import action
from rest_framework.permissions    import IsAuthenticated
from rest_framework.response       import Response
from rest_framework.exceptions     import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    TaiKhoan, DeTai, SinhVien, GiangVien,
    CanBoQuanLy, HuongDan, TienDo,
    BaoCao, HoiDong, DanhGia, ThanhVienHoiDong
)
from .serializers import (
    TaiKhoanSerializer, DeTaiSerializer, SinhVienSerializer,
    GiangVienSerializer, CanBoQuanLySerializer, HuongDanSerializer,
    TienDoSerializer, BaoCaoSerializer, HoiDongSerializer, DanhGiaSerializer,
    DeTaiDangKySerializer, TienDoTaoMoiSerializer,
    BaoCaoNopSerializer, DanhGiaChamDiemSerializer, TienDoVoiNhanXetSerializer, TuChoiDeTaiSerializer,
    PhanCongHoiDongSerializer, NhanXetGVHDSerializer, PhanCongThanhVienSerializer, BaoCaoNopSerializer, BaoCaoChiTietSerializer
)
from .permissions import (
    IsCanBoQuanLy, IsGiangVien, IsSinhVien,
    IsCanBoOrReadOnly, IsSinhVienDungNhom, IsOwnerOrCanBo,
)
from .filters     import DeTaiFilter, SinhVienFilter, TaiKhoanFilter, TienDoFilter
from .pagination  import ChuanPagination, NhoPagination, LonPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response



# ─── Hàm tiện ích (giữ nguyên từ bước trước) ────────────────────────────────
def _get_vai_tro(user):
    try:
        return TaiKhoan.objects.get(TenDangNhap=user.username).QuyenHan
    except TaiKhoan.DoesNotExist:
        return None

def _get_sinh_vien(user):
    try:
        return SinhVien.objects.select_related("MaDeTai").get(
            TenDangNhap__TenDangNhap=user.username
        )
    except SinhVien.DoesNotExist:
        return None

def _get_giang_vien(user):
    try:
        return GiangVien.objects.get(TenDangNhap__TenDangNhap=user.username)
    except GiangVien.DoesNotExist:
        return None

def _tinh_xep_loai(diem: float) -> str:
    if diem >= 9.0:   return DanhGia.XepLoaiChoices.XUAT_SAC
    elif diem >= 8.0: return DanhGia.XepLoaiChoices.GIOI
    elif diem >= 6.5: return DanhGia.XepLoaiChoices.KHA
    elif diem >= 5.0: return DanhGia.XepLoaiChoices.TRUNG_BINH
    else:             return DanhGia.XepLoaiChoices.KHONG_DAT


# ═══════════════════════════════════════════════════════════════════════════════
# BASE VIEWSET — Tất cả ViewSet kế thừa từ đây
# ═══════════════════════════════════════════════════════════════════════════════
class BaseViewSet(viewsets.ModelViewSet):
    """
    Cấu hình mặc định áp dụng cho toàn bộ API:
    - Yêu cầu đăng nhập JWT
    - Phân trang chuẩn 10 bản ghi/trang
    - Cho phép tìm kiếm và lọc
    """
    permission_classes  = [IsAuthenticated]
    pagination_class    = ChuanPagination
    filter_backends     = [
        DjangoFilterBackend,          # Lọc theo field chính xác (?TrangThai=...)
        filters.SearchFilter,         # Tìm kiếm full-text (?search=...)
        filters.OrderingFilter,       # Sắp xếp (?ordering=TenDeTai)
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# 1. TÀI KHOẢN — /api/tai-khoan/
# ═══════════════════════════════════════════════════════════════════════════════
class TaiKhoanViewSet(BaseViewSet):
    """
    Permissions:
    - List/Retrieve : IsAuthenticated (mặc định)
    - Create/Update/Delete : IsCanBoQuanLy
    """
    queryset         = TaiKhoan.objects.all()
    serializer_class = TaiKhoanSerializer

    # Lọc & tìm kiếm tài khoản
    filterset_class  = TaiKhoanFilter
    search_fields    = ["TenDangNhap"]      # ?search=admin
    ordering_fields  = ["TenDangNhap", "QuyenHan"]
    ordering         = ["TenDangNhap"]      # Sắp xếp mặc định A-Z

    def get_permissions(self):
        """
        ── CÁCH ÁP DỤNG PERMISSION THEO ACTION ──────────────────────────────
        get_permissions() được DRF gọi trước mỗi request để xác định
        danh sách permission cần kiểm tra.

        Thay vì gán permission_classes cố định cho cả ViewSet,
        ta override hàm này để gán permission KHÁC NHAU theo từng action:
          - list / retrieve  → IsAuthenticated (xem danh sách)
          - create / update / destroy → IsCanBoQuanLy (chỉ quản lý)
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ĐỀ TÀI — /api/de-tai/
# ═══════════════════════════════════════════════════════════════════════════════
class DeTaiViewSet(BaseViewSet):
    """
    Permissions theo action:
    - list / retrieve : IsAuthenticated (mọi người xem)
    - create          : IsSinhVien (chỉ SV đăng ký)
    - update/destroy  : IsCanBoQuanLy
    - duyet           : IsCanBoQuanLy  ← @action cụ thể
    - gui_nghiem_thu  : IsCanBoQuanLy  ← @action cụ thể
    """
    serializer_class = DeTaiSerializer

    # ── Cấu hình Filtering & Search ─────────────────────────────────────────
    filterset_class = DeTaiFilter           # Dùng class filter đã định nghĩa
    search_fields   = ["MaDeTai", "TenDeTai", "TomTat"]  # ?search=quản lý
    ordering_fields = ["MaDeTai", "TenDeTai", "TrangThai"]
    ordering        = ["MaDeTai"]

    def get_permissions(self):
        """
        ── PHÂN QUYỀN THEO ACTION CHO DETAI ────────────────────────────────

        Sơ đồ phân quyền:
        ┌─────────────────────┬──────────────────────────┐
        │ Action               │ Permission               │
        ├─────────────────────┼──────────────────────────┤
        │ list / retrieve      │ IsAuthenticated          │
        │ create               │ IsSinhVien               │
        │ update / destroy     │ IsCanBoQuanLy            │
        │ duyet_de_tai (@action)│ IsCanBoQuanLy           │
        │ gui_len_hoi_dong     │ IsCanBoQuanLy            │
        └─────────────────────┴──────────────────────────┘
        """
        HANH_DONG_CAN_BO = [
            "create", "update", "partial_update", "destroy",
            "duyet_de_tai", "tu_choi_de_tai", "gui_len_hoi_dong",
            "phan_cong_hoi_dong", "them_thanh_vien_hoi_dong",   # ← thêm action mới
            "nghiem_thu",
        ]
        if self.action == "create":
            return [IsSinhVien()]
        if self.action in HANH_DONG_CAN_BO:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Bộ lọc động theo vai trò (giữ nguyên từ bước trước)."""
        user    = self.request.user
        vai_tro = _get_vai_tro(user)

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = _get_sinh_vien(user)
            if sv is None or sv.MaDeTai is None:
                return DeTai.objects.none()
            return DeTai.objects.filter(MaDeTai=sv.MaDeTai_id)

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = _get_giang_vien(user)
            if gv is None:
                return DeTai.objects.none()
            de_tai_ids = HuongDan.objects.filter(
                MaGV=gv
            ).values_list("MaDeTai_id", flat=True)
            return DeTai.objects.filter(MaDeTai__in=list(de_tai_ids))

        return DeTai.objects.all()

    def get_serializer_class(self):
        vai_tro = _get_vai_tro(self.request.user)
        if self.action == "create" and vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            return DeTaiDangKySerializer
        return DeTaiSerializer

    def perform_create(self, serializer):
        """Quy trình đăng ký đề tài (giữ nguyên từ bước trước)."""
        sv = _get_sinh_vien(self.request.user)
        if sv is None:
            raise ValidationError("Không tìm thấy hồ sơ Sinh viên.")
        if sv.MaDeTai is not None:
            raise ValidationError("Bạn đã có đề tài. Không thể đăng ký thêm.")
        de_tai = serializer.save(TrangThai=DeTai.TrangThaiDeTai.CHO_DUYET)
        sv.MaDeTai = de_tai
        sv.save(update_fields=["MaDeTai"])

    # ── Custom Action: Duyệt đề tài ─────────────────────────────────────────
    @action(detail=True, methods=["patch"], url_path="duyet")
    def duyet_de_tai(self, request, pk=None):
        """
        PATCH /api/de-tai/{MaDeTai}/duyet/

        ── CÁCH PERMISSION HOẠT ĐỘNG TRÊN @action ───────────────────────────
        Khi DRF nhận request đến action "duyet_de_tai":
          1. Gọi get_permissions() → trả về [IsCanBoQuanLy()]
          2. Gọi IsCanBoQuanLy.has_permission(request, view)
          3. Nếu False → trả về 403 Forbidden ngay lập tức
          4. Nếu True → tiếp tục vào hàm duyet_de_tai()

        Vì get_permissions() đã xử lý việc kiểm tra vai trò,
        trong body hàm KHÔNG CẦN viết lại if/raise PermissionDenied nữa.
        Code trong hàm chỉ tập trung vào business logic thuần túy.
        ─────────────────────────────────────────────────────────────────────
        """
        de_tai = self.get_object()  # Tự động raise 404 nếu không tìm thấy

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHO_DUYET:
            raise ValidationError(
                f"Chỉ duyệt được đề tài ở trạng thái 'Chờ Duyệt'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        de_tai.TrangThai = DeTai.TrangThaiDeTai.DANG_THUC_HIEN
        de_tai.save(update_fields=["TrangThai"])

        return Response({
            "message" : f"Đề tài [{de_tai.MaDeTai}] đã được duyệt thành công.",
            "TrangThai": de_tai.get_TrangThai_display(),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="gui-nghiem-thu")
    def gui_len_hoi_dong(self, request, pk=None):
        """PATCH /api/de-tai/{MaDeTai}/gui-nghiem-thu/"""
        de_tai = self.get_object()

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.DANG_THUC_HIEN:
            raise ValidationError(
                f"Đề tài phải đang 'Thực Hiện' mới gửi nghiệm thu được. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHO_NGHIEM_THU
        de_tai.save(update_fields=["TrangThai"])

        return Response({
            "message" : f"Đề tài [{de_tai.MaDeTai}] đã gửi lên Hội đồng nghiệm thu.",
            "TrangThai": de_tai.get_TrangThai_display(),
        }, status=status.HTTP_200_OK)
    
    # api/views.py — THÊM VÀO class DeTaiViewSet

    # ═══════════════════════════════════════════════════════════════════════
    # [CÁN BỘ] Từ chối đề tài
    # PATCH /api/de-tai/{MaDeTai}/tu-choi/
    # STATE: CHODUYET → TUCHOI
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="tu-choi")
    def tu_choi_de_tai(self, request, pk=None):
        de_tai     = self.get_object()
        serializer = TuChoiDeTaiSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHO_DUYET:
            raise ValidationError(
                f"Chỉ từ chối được đề tài đang 'Chờ Duyệt'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        # STATE: CHODUYET → TUCHOI
        de_tai.TrangThai  = DeTai.TrangThaiDeTai.TU_CHOI
        de_tai.LyDoTuChoi = serializer.validated_data["LyDoTuChoi"]
        de_tai.save(update_fields=["TrangThai", "LyDoTuChoi"])

        return Response({
            "message"   : f"Đề tài [{de_tai.MaDeTai}] đã bị từ chối.",
            "TrangThai" : de_tai.get_TrangThai_display(),
            "LyDoTuChoi": de_tai.LyDoTuChoi,
        })

    # ═══════════════════════════════════════════════════════════════════════
    # [CÁN BỘ] Phân công Hội đồng đánh giá cho Đề tài
    # PATCH /api/de-tai/{MaDeTai}/them-thanh-vien-hoi-dong/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["post"], url_path="them-thanh-vien-hoi-dong")
    def them_thanh_vien_hoi_dong(self, request, pk=None):
        """
        POST /api/de-tai/{MaDeTai}/them-thanh-vien-hoi-dong/
        Cán bộ thêm 1 Giảng viên vào Hội đồng chấm của đề tài này.

        ── RÀNG BUỘC CONFLICT OF INTEREST ────────────────────────────────
        Giảng viên hướng dẫn (HuongDan) của đề tài TUYỆT ĐỐI KHÔNG được
        đồng thời là thành viên Hội đồng chấm của CHÍNH đề tài đó.
        """
        de_tai = self.get_object()

        if de_tai.MaHoiDong_id is None:
            raise ValidationError(
                "Đề tài chưa được phân công Hội đồng. "
                "Hãy gọi /phan-cong-hoi-dong/ trước."
            )

        serializer = PhanCongThanhVienSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ma_gv  = serializer.validated_data["MaGV"]
        vai_tro = serializer.validated_data["VaiTro"]

        # ── KIỂM TRA CONFLICT OF INTEREST — CHẶN ĐỨNG TẠI ĐÂY ────────────
        la_giang_vien_huong_dan = HuongDan.objects.filter(
            MaDeTai=de_tai, MaGV_id=ma_gv
        ).exists()

        if la_giang_vien_huong_dan:
            raise ValidationError({
                "detail": (
                    f"Giảng viên '{ma_gv}' là người hướng dẫn của đề tài "
                    f"[{de_tai.MaDeTai}]. Theo quy định, Giảng viên hướng dẫn "
                    "không được tham gia Hội đồng chấm của chính đề tài mình hướng dẫn."
                ),
                "error_code": "CONFLICT_OF_INTEREST",
            })

        # Kiểm tra GV này đã là thành viên hội đồng này chưa
        if ThanhVienHoiDong.objects.filter(
            MaHoiDong=de_tai.MaHoiDong, MaGV_id=ma_gv
        ).exists():
            raise ValidationError(
                f"Giảng viên '{ma_gv}' đã là thành viên Hội đồng "
                f"[{de_tai.MaHoiDong_id}] rồi."
            )

        thanh_vien = ThanhVienHoiDong.objects.create(
            MaHoiDong=de_tai.MaHoiDong,
            MaGV_id=ma_gv,
            VaiTro=vai_tro,
        )

        return Response({
            "message": f"Đã thêm Giảng viên '{ma_gv}' vào Hội đồng "
                       f"[{de_tai.MaHoiDong_id}] với vai trò "
                       f"{thanh_vien.get_VaiTro_display()}.",
            "MaThanhVien": thanh_vien.MaThanhVien,
        }, status=status.HTTP_201_CREATED)

    # ═══════════════════════════════════════════════════════════════════════
    # [CÁN BỘ] Tổng hợp kết quả & chuyển trạng thái nghiệm thu
    # POST /api/de-tai/{MaDeTai}/nghiem-thu/
    # STATE: CHONGHIEMTHU → DANGHIEMTHU
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["post"], url_path="nghiem-thu")
    def nghiem_thu(self, request, pk=None):
        de_tai = self.get_object()

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHO_NGHIEM_THU:
            raise ValidationError(
                f"Chỉ nghiệm thu đề tài đang 'Chờ Nghiệm Thu'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        # Lấy tất cả phiếu đánh giá của đề tài này
        danh_sach_dg = DanhGia.objects.filter(MaDeTai=de_tai)
        if not danh_sach_dg.exists():
            raise ValidationError(
                "Chưa có phiếu đánh giá nào. "
                "Hội đồng phải chấm điểm trước khi nghiệm thu."
            )

        # Tính điểm tổng hợp
        ket_qua  = danh_sach_dg.aggregate(diem_tb=Avg("DiemSo"))
        diem_tb  = round(ket_qua["diem_tb"], 2)
        xep_loai = _tinh_xep_loai(diem_tb)

        # Cập nhật tất cả phiếu với xếp loại chung
        danh_sach_dg.update(XepLoai=xep_loai)

        # STATE: CHONGHIEMTHU → DANGHIEMTHU
        de_tai.TrangThai  = DeTai.TrangThaiDeTai.DA_NGHIEM_THU
        de_tai.DiemTongHop = diem_tb
        de_tai.save(update_fields=["TrangThai", "DiemTongHop"])

        return Response({
            "message"      : f"Đề tài [{de_tai.MaDeTai}] đã nghiệm thu thành công.",
            "TrangThai"    : de_tai.get_TrangThai_display(),
            "DiemTongHop"  : diem_tb,
            "XepLoaiChung" : dict(DanhGia.XepLoaiChoices.choices).get(xep_loai),
            "SoPhieuCham"  : danh_sach_dg.count(),
        })

    # ═══════════════════════════════════════════════════════════════════════
    # [SINH VIÊN] Xem kết quả đánh giá đề tài của mình
    # GET /api/de-tai/{MaDeTai}/ket-qua-danh-gia/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["get"], url_path="ket-qua-danh-gia")
    def ket_qua_danh_gia(self, request, pk=None):
        de_tai = self.get_object()  # get_queryset() đã lọc theo vai trò

        danh_sach = DanhGia.objects.filter(
            MaDeTai=de_tai
        ).select_related("MaHoiDong")

        if not danh_sach.exists():
            return Response({
                "message"    : "Đề tài chưa có kết quả đánh giá.",
                "TrangThai"  : de_tai.get_TrangThai_display(),
                "DiemTongHop": None,
                "ChiTiet"    : [],
            })

        return Response({
            "MaDeTai"    : de_tai.MaDeTai,
            "TenDeTai"   : de_tai.TenDeTai,
            "TrangThai"  : de_tai.get_TrangThai_display(),
            "DiemTongHop": de_tai.DiemTongHop,
            "ChiTiet"    : KetQuaDanhGiaSerializer(danh_sach, many=True).data,
        })

    # ═══════════════════════════════════════════════════════════════════════
    # Override get_permissions() — cập nhật để bao gồm các action mới
    # ═══════════════════════════════════════════════════════════════════════
    def get_permissions(self):
        HANH_DONG_CAN_BO = [
            "create", "update", "partial_update", "destroy",
            "duyet_de_tai", "tu_choi_de_tai",
            "gui_len_hoi_dong", "phan_cong_hoi_dong", "nghiem_thu",
        ]
        if self.action == "create":
            return [IsSinhVien()]
        if self.action in HANH_DONG_CAN_BO:
            return [IsCanBoQuanLy()]
        # list, retrieve, ket_qua_danh_gia → mọi người đăng nhập
        return [IsAuthenticated()]


# ═══════════════════════════════════════════════════════════════════════════════
# 3. SINH VIÊN — /api/sinh-vien/
# ═══════════════════════════════════════════════════════════════════════════════
class SinhVienViewSet(BaseViewSet):
    serializer_class = SinhVienSerializer
    filterset_class  = SinhVienFilter
    search_fields    = ["MaSV", "TenSV", "Lop", "Khoa"]  # ?search=CT080149
    ordering_fields  = ["MaSV", "TenSV", "Lop"]
    ordering         = ["MaSV"]

    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            # SV chỉ được sửa hồ sơ của chính mình; QUANLY sửa của ai cũng được
            return [IsOwnerOrCanBo()]
        if self.action == "destroy":
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user    = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = SinhVien.objects.select_related("TenDangNhap", "MaDeTai")

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            return base_qs.filter(TenDangNhap__TenDangNhap=user.username)

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = _get_giang_vien(user)
            if gv is None:
                return SinhVien.objects.none()
            ids = HuongDan.objects.filter(MaGV=gv).values_list("MaDeTai_id", flat=True)
            return base_qs.filter(MaDeTai__in=ids)

        return base_qs.all()


# ═══════════════════════════════════════════════════════════════════════════════
# 4. GIẢNG VIÊN — /api/giang-vien/
# ═══════════════════════════════════════════════════════════════════════════════
class GiangVienViewSet(BaseViewSet):
    queryset         = GiangVien.objects.select_related("TenDangNhap").all()
    serializer_class = GiangVienSerializer
    search_fields    = ["MaGV", "TenGV", "HocHamHocVi"]
    ordering_fields  = ["MaGV", "TenGV"]
    ordering         = ["MaGV"]

    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            return [IsOwnerOrCanBo()]
        if self.action == "destroy":
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CÁN BỘ QUẢN LÝ — /api/can-bo-quan-ly/
# ═══════════════════════════════════════════════════════════════════════════════
class CanBoQuanLyViewSet(BaseViewSet):
    queryset         = CanBoQuanLy.objects.select_related("TenDangNhap").all()
    serializer_class = CanBoQuanLySerializer
    search_fields    = ["MaCB", "TenCB", "PhongBan"]
    ordering         = ["MaCB"]

    def get_permissions(self):
        # Chỉ QUANLY được tạo/sửa/xóa cán bộ khác
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]


# ═══════════════════════════════════════════════════════════════════════════════
# 6. HƯỚNG DẪN — /api/huong-dan/
# ═══════════════════════════════════════════════════════════════════════════════
class HuongDanViewSet(BaseViewSet):
    serializer_class = HuongDanSerializer
    ordering         = ["MaHuongDan"]

    def get_permissions(self):
        # Chỉ QUANLY được phân công hướng dẫn
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user    = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = HuongDan.objects.select_related("MaDeTai", "MaGV")

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = _get_giang_vien(user)
            return base_qs.filter(MaGV=gv) if gv else HuongDan.objects.none()

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = _get_sinh_vien(user)
            if sv is None or sv.MaDeTai is None:
                return HuongDan.objects.none()
            return base_qs.filter(MaDeTai=sv.MaDeTai)

        return base_qs.all()
    # api/views.py — THÊM VÀO class HuongDanViewSet

    # ═══════════════════════════════════════════════════════════════════════
    # [GIẢNG VIÊN] Xác nhận nhận hướng dẫn đề tài
    # PATCH /api/huong-dan/{MaHuongDan}/xac-nhan/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="xac-nhan")
    def xac_nhan_huong_dan(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được xác nhận hướng dẫn.")

        huong_dan  = self.get_object()
        giang_vien = _get_giang_vien(request.user)

        # Kiểm tra đây có phải phân công của chính GV đang đăng nhập không
        if huong_dan.MaGV != giang_vien:
            raise PermissionDenied(
                "Bạn không thể xác nhận phân công hướng dẫn của người khác."
            )

        if huong_dan.DaXacNhan:
            return Response({
                "message"    : "Bạn đã xác nhận hướng dẫn đề tài này trước đó.",
                "NgayXacNhan": huong_dan.NgayXacNhan,
            })

        huong_dan.DaXacNhan  = True
        huong_dan.NgayXacNhan = timezone.now()
        huong_dan.save(update_fields=["DaXacNhan", "NgayXacNhan"])

        return Response({
            "message"    : f"Đã xác nhận hướng dẫn đề tài [{huong_dan.MaDeTai_id}].",
            "DaXacNhan"  : True,
            "NgayXacNhan": huong_dan.NgayXacNhan,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# 7. TIẾN ĐỘ — /api/tien-do/
# ═══════════════════════════════════════════════════════════════════════════════
class TienDoViewSet(BaseViewSet):
    """
    IsSinhVienDungNhom được áp dụng cho update/partial_update/destroy:
    → DRF sẽ gọi has_object_permission() sau khi get_object() được gọi,
      kiểm tra xem TienDo.MaDeTai có thuộc đề tài của SV đang đăng nhập không.
    """
    serializer_class = TienDoSerializer
    filterset_class  = TienDoFilter
    ordering_fields  = ["NgayCapNhat", "TyLeHoanThanh"]
    ordering         = ["-NgayCapNhat"]
    pagination_class = LonPagination    # Override: 20 bản ghi/trang
    filterset_fields = ["MaDeTai"]
    parser_classes = [MultiPartParser, FormParser]
    def get_permissions(self):
        if self.action == "create":
            return [IsSinhVien()]
        if self.action in ["update", "partial_update", "destroy"]:
            # Object-level: kiểm tra SV có sở hữu TienDo này không
            return [IsSinhVienDungNhom()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        vai_tro = _get_vai_tro(self.request.user)
        if self.action == "create" and vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            return TienDoTaoMoiSerializer
        return TienDoSerializer

    def get_queryset(self):
        user    = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = TienDo.objects.select_related("MaDeTai").order_by("-NgayCapNhat")

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = _get_sinh_vien(user)
            if sv is None or sv.MaDeTai is None:
                return TienDo.objects.none()
            return base_qs.filter(MaDeTai=sv.MaDeTai)

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = _get_giang_vien(user)
            if gv is None:
                return TienDo.objects.none()
            ids = HuongDan.objects.filter(MaGV=gv).values_list("MaDeTai_id", flat=True)
            return base_qs.filter(MaDeTai__in=ids)

        return base_qs.all()

    def perform_create(self, serializer):
        sv = _get_sinh_vien(self.request.user)
        if sv is None or sv.MaDeTai is None:
            raise ValidationError("Bạn chưa có đề tài. Không thể cập nhật tiến độ.")
        if sv.MaDeTai.TrangThai != DeTai.TrangThaiDeTai.DANG_THUC_HIEN:
            raise ValidationError(
                f"Chỉ cập nhật tiến độ khi đề tài đang 'Thực Hiện'. "
                f"Hiện tại: '{sv.MaDeTai.get_TrangThai_display()}'."
            )
        ty_le = serializer.validated_data.get("TyLeHoanThanh", 0)
        if not (0 <= ty_le <= 100):
            raise ValidationError("Tỷ lệ hoàn thành phải trong khoảng 0–100%.")
        serializer.save(MaDeTai=sv.MaDeTai)
    # api/views.py — THÊM VÀO class TienDoViewSet

    # ═══════════════════════════════════════════════════════════════════════
    # [SINH VIÊN] Xem tiến độ kèm phản hồi của GVHD
    # GET /api/tien-do/phan-hoi-gvhd/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=False, methods=["get"], url_path="phan-hoi-gvhd")
    def phan_hoi_gvhd(self, request):
        sv = _get_sinh_vien(request.user)
        if sv is None or sv.MaDeTai is None:
            return Response({
                "message": "Bạn chưa có đề tài.",
                "results": [],
            })

        # Lấy toàn bộ tiến độ của đề tài SV, chỉ hiện những bản có nhận xét
        tien_dos = TienDo.objects.filter(
            MaDeTai=sv.MaDeTai,
            NhanXetGVHD__gt=""          # Chỉ lấy bản ghi đã có nhận xét
        ).order_by("-NgayCapNhat")

        serializer = TienDoVoiNhanXetSerializer(tien_dos, many=True)
        return Response({
            "MaDeTai" : sv.MaDeTai_id,
            "TenDeTai": sv.MaDeTai.TenDeTai,
            "SoNhanXet": tien_dos.count(),
            "results" : serializer.data,
        })

    # ═══════════════════════════════════════════════════════════════════════
    # [GIẢNG VIÊN] Nhận xét tiến độ của Sinh viên
    # PATCH /api/tien-do/{MaTienDo}/nhan-xet/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="nhan-xet")
    def nhan_xet(self, request, pk=None):
        # Kiểm tra quyền: chỉ Giảng viên
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được nhận xét tiến độ.")

        tien_do    = self.get_object()
        serializer = NhanXetGVHDSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Kiểm tra GVHD này có phụ trách đề tài đó không
        giang_vien = _get_giang_vien(request.user)
        co_phu_trach = HuongDan.objects.filter(
            MaDeTai=tien_do.MaDeTai,
            MaGV=giang_vien,
            DaXacNhan=True,
        ).exists()

        if not co_phu_trach:
            raise PermissionDenied(
                "Bạn không phụ trách đề tài này hoặc chưa xác nhận hướng dẫn."
            )

        # Lưu nhận xét kèm thời gian
        tien_do.NhanXetGVHD = serializer.validated_data["NhanXetGVHD"]
        tien_do.NgayNhanXet  = timezone.now()
        tien_do.save(update_fields=["NhanXetGVHD", "NgayNhanXet"])

        return Response({
            "message"    : "Đã lưu nhận xét thành công.",
            "MaTienDo"   : tien_do.MaTienDo,
            "NhanXetGVHD": tien_do.NhanXetGVHD,
            "NgayNhanXet": tien_do.NgayNhanXet,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# 8. BÁO CÁO — /api/bao-cao/
# ═══════════════════════════════════════════════════════════════════════════════
def _la_thanh_vien_hoi_dong_cua_de_tai(user, de_tai) -> bool:
    """Kiểm tra user đang đăng nhập có phải GV trong Hội đồng của đề tài không."""
    giang_vien = _get_giang_vien(user)
    if giang_vien is None or de_tai.MaHoiDong_id is None:
        return False
    return ThanhVienHoiDong.objects.filter(
        MaHoiDong=de_tai.MaHoiDong, MaGV=giang_vien
    ).exists()


class BaoCaoViewSet(BaseViewSet):
    # ── BẮT BUỘC: cho phép Django nhận multipart/form-data từ form upload ──
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == "create":
            return BaoCaoNopSerializer
        return BaoCaoChiTietSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsSinhVien()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsSinhVienDungNhom()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user    = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = BaoCao.objects.select_related("MaDeTai", "MaDeTai__MaHoiDong")

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = _get_sinh_vien(user)
            if sv is None or sv.MaDeTai is None:
                return BaoCao.objects.none()
            return base_qs.filter(MaDeTai=sv.MaDeTai)

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            # GV chỉ thấy báo cáo của đề tài mà mình là HĐ chấm hoặc GVHD
            giang_vien = _get_giang_vien(user)
            if giang_vien is None:
                return BaoCao.objects.none()

            de_tai_huong_dan = HuongDan.objects.filter(
                MaGV=giang_vien
            ).values_list("MaDeTai_id", flat=True)

            de_tai_hoi_dong = ThanhVienHoiDong.objects.filter(
                MaGV=giang_vien
            ).values_list("MaHoiDong__de_tais__MaDeTai", flat=True)

            return base_qs.filter(
                MaDeTai__in=list(de_tai_huong_dan) + list(de_tai_hoi_dong)
            )

        return base_qs.all()   # Cán bộ thấy tất cả

    def get_serializer_context(self):
        """
        ── ĐIỂM MẤU CHỐT KIỂM SOÁT QUYỀN XEM FILE ──────────────────────────
        Đưa flag 'user_co_quyen_xem_file' vào context để
        BaoCaoChiTietSerializer.get_FileBaoCao() quyết định có trả URL không.
        """
        context = super().get_serializer_context()

        if self.action in ["retrieve", "list"]:
            user    = self.request.user
            vai_tro = _get_vai_tro(user)

            if vai_tro == TaiKhoan.QuyenHanChoices.QUAN_LY:
                # Cán bộ luôn được xem file
                context["user_co_quyen_xem_file"] = True

            elif vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
                # Sinh viên xem được file báo cáo của chính mình
                context["user_co_quyen_xem_file"] = True

            elif vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
                # ── QUY TẮC: chỉ thành viên HỘI ĐỒNG CHẤM mới xem được ────
                # Giảng viên hướng dẫn (không thuộc HĐ) KHÔNG được xem file
                # để tránh việc GVHD biết trước nội dung trước khi HĐ chấm
                pk = self.kwargs.get("pk")
                if pk:
                    de_tai = BaoCao.objects.filter(pk=pk).select_related(
                        "MaDeTai", "MaDeTai__MaHoiDong"
                    ).first()
                    if de_tai:
                        context["user_co_quyen_xem_file"] = (
                            _la_thanh_vien_hoi_dong_cua_de_tai(user, de_tai.MaDeTai)
                        )
                else:
                    context["user_co_quyen_xem_file"] = False
            else:
                context["user_co_quyen_xem_file"] = False

        return context

    def perform_create(self, serializer):
        sv = _get_sinh_vien(self.request.user)
        if sv is None or sv.MaDeTai is None:
            raise ValidationError("Bạn chưa có đề tài.")

        de_tai = sv.MaDeTai
        if de_tai.TrangThai != DeTai.TrangThaiDeTai.DANG_THUC_HIEN:
            raise ValidationError(
                f"Chỉ nộp báo cáo khi đề tài đang 'Thực Hiện'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        serializer.save(MaDeTai=de_tai, NgayNop=timezone.now())

        # STATE: DANGTHUCHIEN → CHONGHIEMTHU
        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHO_NGHIEM_THU
        de_tai.save(update_fields=["TrangThai"])


# ═══════════════════════════════════════════════════════════════════════════════
# 9. HỘI ĐỒNG — /api/hoi-dong/
# ═══════════════════════════════════════════════════════════════════════════════
class HoiDongViewSet(BaseViewSet):
    queryset         = HoiDong.objects.all()
    serializer_class = HoiDongSerializer
    search_fields    = ["MaHoiDong", "TenHoiDong", "QuyetDinh"]
    pagination_class = NhoPagination    # Override: 5 bản ghi/trang

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ĐÁNH GIÁ — /api/danh-gia/
# ═══════════════════════════════════════════════════════════════════════════════
# api/views.py — THAY THẾ TOÀN BỘ class DanhGiaViewSet cũ

from .serializers import DanhGiaChamDiemSerializer, DanhGiaXemSerializer


class DanhGiaViewSet(BaseViewSet):

    def get_serializer_class(self):
        if self.action == "create":
            return DanhGiaChamDiemSerializer
        return DanhGiaXemSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsGiangVien()]   # Chỉ GV (thành viên HĐ) mới chấm điểm
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]  # Sửa/xóa phiếu điểm chỉ CB mới được
        return [IsAuthenticated()]

    def get_queryset(self):
        user    = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = DanhGia.objects.select_related(
            "MaHoiDong", "MaDeTai", "ThanhVienCham__MaGV"
        )

        if vai_tro == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = _get_sinh_vien(user)
            if sv is None or sv.MaDeTai is None:
                return DanhGia.objects.none()
            return base_qs.filter(MaDeTai=sv.MaDeTai)

        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            giang_vien = _get_giang_vien(user)
            if giang_vien is None:
                return DanhGia.objects.none()
            # GV chỉ thấy phiếu điểm do chính mình chấm
            return base_qs.filter(ThanhVienCham__MaGV=giang_vien)

        return base_qs.all()   # Cán bộ thấy tất cả

    def perform_create(self, serializer):
        """
        ── LOGIC CHẤM ĐIỂM ĐỘC LẬP TỪNG THÀNH VIÊN ────────────────────────

        1. Xác định Giảng viên đang đăng nhập là ai
        2. Tìm bản ghi ThanhVienHoiDong của GV này trong hội đồng đề tài
        3. Mỗi GV chỉ được chấm 1 lần (unique_together chặn ở DB level)
        4. Sau khi chấm xong, kiểm tra ĐỦ SỐ THÀNH VIÊN đã chấm chưa
           → nếu đủ, tự động tính điểm trung bình và nghiệm thu
        """
        ma_hoi_dong = self.request.data.get("MaHoiDong")
        ma_de_tai   = self.request.data.get("MaDeTai")

        if not ma_hoi_dong or not ma_de_tai:
            raise ValidationError("Thiếu MaHoiDong hoặc MaDeTai.")

        hoi_dong = get_object_or_404(HoiDong, pk=ma_hoi_dong)
        de_tai   = get_object_or_404(DeTai, pk=ma_de_tai)

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHO_NGHIEM_THU:
            raise ValidationError(
                f"Chỉ chấm điểm đề tài đang 'Chờ Nghiệm Thu'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        # ── XÁC ĐỊNH: GV đang đăng nhập có phải thành viên hội đồng này ───
        giang_vien = _get_giang_vien(self.request.user)
        thanh_vien = ThanhVienHoiDong.objects.filter(
            MaHoiDong=hoi_dong, MaGV=giang_vien
        ).first()

        if thanh_vien is None:
            raise PermissionDenied(
                f"Bạn không phải là thành viên của Hội đồng [{ma_hoi_dong}], "
                "không có quyền chấm điểm đề tài này."
            )

        # Chặn chấm trùng (unique_together cũng chặn nhưng raise lỗi rõ ràng hơn ở đây)
        if DanhGia.objects.filter(ThanhVienCham=thanh_vien, MaDeTai=de_tai).exists():
            raise ValidationError("Bạn đã chấm điểm đề tài này rồi.")

        diem_so  = serializer.validated_data.get("DiemSo", 0)
        xep_loai = _tinh_xep_loai(diem_so)

        # Lưu phiếu điểm gắn với đúng thành viên đã chấm
        serializer.save(
            MaHoiDong=hoi_dong,
            MaDeTai=de_tai,
            ThanhVienCham=thanh_vien,
            XepLoai=xep_loai,
        )

        # ── KIỂM TRA ĐỦ SỐ THÀNH VIÊN ĐÃ CHẤM CHƯA ─────────────────────────
        tong_thanh_vien = ThanhVienHoiDong.objects.filter(MaHoiDong=hoi_dong).count()
        so_da_cham      = DanhGia.objects.filter(
            MaHoiDong=hoi_dong, MaDeTai=de_tai
        ).count()

        if tong_thanh_vien > 0 and so_da_cham >= tong_thanh_vien:
            # ── TẤT CẢ THÀNH VIÊN ĐÃ CHẤM XONG → TỰ ĐỘNG NGHIỆM THU ─────
            tat_ca_diem = DanhGia.objects.filter(MaHoiDong=hoi_dong, MaDeTai=de_tai)
            diem_tb     = round(tat_ca_diem.aggregate(tb=Avg("DiemSo"))["tb"], 2)
            xep_loai_tb = _tinh_xep_loai(diem_tb)

            tat_ca_diem.update(XepLoai=xep_loai_tb)

            de_tai.TrangThai   = DeTai.TrangThaiDeTai.DA_NGHIEM_THU
            de_tai.DiemTongHop = diem_tb
            de_tai.save(update_fields=["TrangThai", "DiemTongHop"])
    

# Thêm vào api/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lay_thong_tin_ca_nhan(request):
    """
    GET /api/me/
    Trả về thông tin chi tiết của tài khoản đang đăng nhập bao gồm cả mã định danh theo vai trò.
    """
    username = request.user.username
    try:
        tai_khoan = TaiKhoan.objects.get(TenDangNhap=username)
    except TaiKhoan.DoesNotExist:
        return Response({"error": "Không tìm thấy tài khoản."}, status=404)

    ten_hien_thi = username
    ma_dinh_danh = ""  # THÊM MỚI: Dùng để lưu MaSV, MaGV hoặc MaCB

    try:
        if tai_khoan.QuyenHan == TaiKhoan.QuyenHanChoices.SINH_VIEN:
            sv = SinhVien.objects.get(TenDangNhap=tai_khoan)
            ten_hien_thi = sv.TenSV
            ma_dinh_danh = sv.MaSV  # Lấy Mã Sinh Viên
        elif tai_khoan.QuyenHan == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = GiangVien.objects.get(TenDangNhap=tai_khoan)
            ten_hien_thi = gv.TenGV
            ma_dinh_danh = gv.MaGV  # Lấy Mã Giảng Viên
        elif tai_khoan.QuyenHan == TaiKhoan.QuyenHanChoices.QUAN_LY:
            cb = CanBoQuanLy.objects.get(TenDangNhap=tai_khoan)
            ten_hien_thi = cb.TenCB
            ma_dinh_danh = cb.MaCB  # Lấy Mã Cán Bộ
    except Exception:
        pass

    return Response({
        "TenDangNhap" : tai_khoan.TenDangNhap,
        "TenHienThi"  : ten_hien_thi,
        "MaDinhDanh"  : ma_dinh_danh,  # THÊM MỚI
        "QuyenHan"    : tai_khoan.QuyenHan,
        "QuyenHan_display": tai_khoan.get_QuyenHan_display(),
        "TrangThai"   : tai_khoan.TrangThai,
    })
    

# api/views.py — THÊM VÀO CUỐI FILE
from rest_framework.permissions import AllowAny
from .models      import BaiBaoNCKH
from .serializers import BaiBaoNCKHListSerializer, BaiBaoNCKHDetailSerializer


class BaiBaoNCKHViewSet(viewsets.GenericViewSet):
    """
    Public API — Không yêu cầu đăng nhập (AllowAny).
    Cung cấp 2 endpoint cho Landing Page:
      GET /api/bai-bao/           → 3 bài báo ngẫu nhiên (trang chủ)
      GET /api/bai-bao/{id}/      → Chi tiết 1 bài báo (popup/modal)
    """
    permission_classes = [AllowAny]   # Ai cũng gọi được, kể cả chưa đăng nhập

    def get_queryset(self):
        # Chỉ lấy bài báo đang được bật hiển thị
        return BaiBaoNCKH.objects.filter(IsActive=True)

    def get_serializer_class(self):
        # Tự chọn serializer theo action
        if self.action == "retrieve":
            return BaiBaoNCKHDetailSerializer
        return BaiBaoNCKHListSerializer

    def list(self, request, *args, **kwargs):
        """
        GET /api/bai-bao/
        Trả về 3 bài báo ngẫu nhiên mỗi lần gọi.
        order_by('?') → Django dùng ORDER BY RANDOM() trong SQL.
        Phù hợp cho dataset nhỏ (~20 bản ghi), không cần cache phức tạp.
        """
        queryset   = self.get_queryset().order_by("?")[:3]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        GET /api/bai-bao/{id}/
        Trả về nội dung chi tiết của 1 bài báo theo ID.
        Dùng khi người dùng bấm "Xem chi tiết".
        """
        instance   = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)