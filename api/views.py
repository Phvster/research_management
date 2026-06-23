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
    PhanCongHoiDongSerializer, NhanXetGVHDSerializer, PhanCongThanhVienSerializer, BaoCaoNopSerializer, BaoCaoChiTietSerializer,
    HoiDongTaoMoiSerializer
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
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


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
    serializer_class = DeTaiSerializer
    filterset_class = DeTaiFilter
    search_fields   = ["MaDeTai", "TenDeTai", "TomTat"]
    ordering_fields = ["MaDeTai", "TenDeTai", "TrangThai"]
    ordering        = ["MaDeTai"]

    def get_queryset(self):
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
        sv = _get_sinh_vien(self.request.user)
        if sv is None:
            raise ValidationError("Không tìm thấy hồ sơ Sinh viên.")
        if sv.MaDeTai is not None:
            raise ValidationError("Bạn đã có đề tài. Không thể đăng ký thêm.")

        danh_sach_thanh_vien = serializer.validated_data.pop("DanhSachThanhVien", [])
        ma_gv = serializer.validated_data.pop("MaGV_HuongDan", None)

        if sv.MaSV in danh_sach_thanh_vien:
            danh_sach_thanh_vien.remove(sv.MaSV)

        de_tai = serializer.save(TrangThai=DeTai.TrangThaiDeTai.CHODUYET)

        sv.MaDeTai = de_tai
        sv.save(update_fields=["MaDeTai"])

        if danh_sach_thanh_vien:
            SinhVien.objects.filter(MaSV__in=danh_sach_thanh_vien).update(MaDeTai=de_tai)
            
        if ma_gv:
            HuongDan.objects.create(
                MaDeTai=de_tai,
                MaGV_id=ma_gv,
                VaiTro="Chủ nhiệm",
                TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.CHO_XAC_NHAN
            )
        from .models import ThongBao, CanBoQuanLy
        ds_can_bo = CanBoQuanLy.objects.values_list('TenDangNhap_id', flat=True)
        for cb_id in ds_can_bo:
            ThongBao.objects.create(
                TenDangNhap_id=cb_id,
                NoiDung=f"Có đơn đăng ký đề tài mới cần phê duyệt: '{de_tai.TenDeTai}' (Mã: {de_tai.MaDeTai}).",
                Loai=ThongBao.LoaiThongBao.DE_TAI
            )




    @action(detail=True, methods=["patch"], url_path="duyet")
    def duyet_de_tai(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.QUAN_LY:
            raise PermissionDenied("Chỉ Cán bộ quản lý mới được duyệt đề tài bước 1.")

        de_tai = self.get_object()

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHODUYET:
            raise ValidationError(f"Đề tài không ở trạng thái chờ duyệt. Hiện tại: {de_tai.get_TrangThai_display()}")

        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHO_XAC_NHAN_GV
        de_tai.save(update_fields=["TrangThai"])
        from .models import ThongBao, HuongDan
        huong_dan = HuongDan.objects.filter(
            MaDeTai=de_tai,
            TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.CHO_XAC_NHAN
        ).first()
        if huong_dan:
            ThongBao.objects.create(
                TenDangNhap_id=huong_dan.MaGV.TenDangNhap_id,
                NoiDung=f"Bạn nhận được lời mời hướng dẫn đề tài nghiên cứu: '{de_tai.TenDeTai}'. Vui lòng xác nhận.",
                Loai=ThongBao.LoaiThongBao.DE_TAI
            )

        return Response({
            "message" : f"Cán bộ đã duyệt đề tài [{de_tai.MaDeTai}]. Hệ thống đang chờ Giảng viên xác nhận.",
            "TrangThai": de_tai.get_TrangThai_display(),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="tu-choi")
    def tu_choi_de_tai(self, request, pk=None):
        de_tai = self.get_object()
        de_tai.delete()
        from .models import ThongBao
    # Tìm sinh viên chủ nhiệm / trưởng nhóm của đề tài này 

        sv_chu_nhiem = de_tai.sinh_viens.first() 
        if sv_chu_nhiem: 
            ThongBao.objects.create(
                TenDangNhap=sv_chu_nhiem.TenDangNhap,
                NoiDung=f"Thông báo: Đề tài đơn đăng ký '{de_tai.TenDeTai}' của nhóm bạn đã bị Cán bộ quản lý từ chối phê duyệt. Lý do: '{ly_do}'. Vui lòng rà soát lại quy chế và tiến hành đăng ký đề tài mới.",
                Loai=ThongBao.LoaiThongBao.DE_TAI
        ) 



        return Response({"message": "Đã từ chối đơn đăng ký. Đề tài đã bị loại bỏ, sinh viên có thể đăng ký đề tài mới."})

    # ═══════════════════════════════════════════════════════════════════════
    # 2 HÀM XÁC NHẬN / TỪ CHỐI CỦA GIẢNG VIÊN (SỬA LỖI 404 TẠI ĐÂY)
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="xac-nhan")
    def xac_nhan_huong_dan(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được xác nhận hướng dẫn.")

        de_tai = self.get_object() 
        giang_vien = _get_giang_vien(request.user)

        from django.shortcuts import get_object_or_404
        huong_dan = get_object_or_404(HuongDan, MaDeTai=de_tai, MaGV=giang_vien)

        huong_dan.TrangThaiXacNhan = HuongDan.TrangThaiLoiMoi.DA_XAC_NHAN
        huong_dan.save(update_fields=["TrangThaiXacNhan"])

        de_tai.TrangThai = DeTai.TrangThaiDeTai.DANGTHUCHIEN
        de_tai.save(update_fields=["TrangThai"])

        sv_chu_nhiem = de_tai.sinh_viens.first()
        if sv_chu_nhiem:
            ThongBao.objects.create(
                TenDangNhap=sv_chu_nhiem.TenDangNhap,
                NoiDung=f"Chúc mừng! Giảng viên {giang_vien.TenGV} đã chấp nhận hướng dẫn đề tài '{de_tai.TenDeTai}' của nhóm bạn. Đề tài đã được kích hoạt thực hiện.",
                Loai=ThongBao.LoaiThongBao.DE_TAI )

        return Response({"message": "Thầy/Cô đã chấp nhận hướng dẫn. Đề tài đã chính thức được kích hoạt."})

    @action(detail=True, methods=["patch"], url_path="tu-choi-gv")
    def tu_choi_huong_dan(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được từ chối hướng dẫn.")

        de_tai = self.get_object()
        giang_vien = _get_giang_vien(request.user)

        from django.shortcuts import get_object_or_404
        huong_dan = get_object_or_404(HuongDan, MaDeTai=de_tai, MaGV=giang_vien)

        huong_dan.TrangThaiXacNhan = HuongDan.TrangThaiLoiMoi.TU_CHOI
        huong_dan.save(update_fields=["TrangThaiXacNhan"])

        de_tai.TrangThai = DeTai.TrangThaiDeTai.GV_TU_CHOI
        de_tai.save(update_fields=["TrangThai"])

        
        sv_chu_nhiem = de_tai.sinh_viens.first()
        if sv_chu_nhiem: ThongBao.objects.create(
            TenDangNhap=sv_chu_nhiem.TenDangNhap,
            NoiDung=f"Cảnh báo: Giảng viên đã từ chối hướng dẫn đề tài '{de_tai.TenDeTai}'. Vui lòng vào không gian quản lý để tiến hành đề xuất Giảng viên mới.",
            Loai=ThongBao.LoaiThongBao.DE_TAI
        ) 
        return Response({"message": "Thầy/Cô đã từ chối hướng dẫn. Sinh viên sẽ nhận được thông báo để đổi Giảng viên khác."})

    @action(detail=True, methods=["patch"], url_path="doi-giang-vien")
    def student_change_teacher(self, request, pk=None):
        de_tai = self.get_object()
        if de_tai.TrangThai != DeTai.TrangThaiDeTai.GV_TU_CHOI:
            raise ValidationError("Bạn chỉ được phép đổi giảng viên khi giảng viên trước đó từ chối hướng dẫn.")

        new_ma_gv = request.data.get("MaGV_Moi")
        
        da_tung_tu_choi = HuongDan.objects.filter(
            MaDeTai=de_tai, 
            MaGV_id=new_ma_gv, 
            TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.TU_CHOI
        ).exists()
        
        if da_tung_tu_choi:
            raise ValidationError("Giảng viên này đã từ chối nhóm bạn trước đó. Bạn bắt buộc phải mời một người khác!")

        from .models import GiangVien
        gv_moi = get_object_or_404(GiangVien, pk=new_ma_gv)
        HuongDan.objects.create(
            MaDeTai=de_tai,
            MaGV=gv_moi,
            VaiTro="Chủ nhiệm",
            TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.CHO_XAC_NHAN
        )

        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHODUYET
        de_tai.save(update_fields=["TrangThai"])

        return Response({"message": "Đổi giảng viên thành công. Đề tài đã được gửi lại cho Cán bộ quản lý duyệt lại."})

    @action(detail=True, methods=["patch"], url_path="gui-nghiem-thu")
    def gui_len_hoi_dong(self, request, pk=None):
        de_tai = self.get_object()

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.DANGTHUCHIEN:
            raise ValidationError(
                f"Đề tài phải đang 'Thực Hiện' mới gửi nghiệm thu được. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHONGHIEMTHU
        de_tai.save(update_fields=["TrangThai"])

        return Response({
            "message" : f"Đề tài [{de_tai.MaDeTai}] đã gửi lên Hội đồng nghiệm thu.",
            "TrangThai": de_tai.get_TrangThai_display(),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="them-thanh-vien-hoi-dong")
    def them_thanh_vien_hoi_dong(self, request, pk=None):
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

    @action(detail=True, methods=["post"], url_path="nghiem-thu")
    def nghiem_thu(self, request, pk=None):
        de_tai = self.get_object()

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHONGHIEMTHU:
            raise ValidationError(
                f"Chỉ nghiệm thu đề tài đang 'Chờ Nghiệm Thu'. "
                f"Hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        danh_sach_dg = DanhGia.objects.filter(MaDeTai=de_tai)
        if not danh_sach_dg.exists():
            raise ValidationError(
                "Chưa có phiếu đánh giá nào. "
                "Hội đồng phải chấm điểm trước khi nghiệm thu."
            )

        ket_qua  = danh_sach_dg.aggregate(diem_tb=Avg("DiemSo"))
        diem_tb  = round(ket_qua["diem_tb"], 2)
        xep_loai = _tinh_xep_loai(diem_tb)

        danh_sach_dg.update(XepLoai=xep_loai)

        de_tai.TrangThai  = DeTai.TrangThaiDeTai.DANGHIEMTHU
        de_tai.DiemTongHop = diem_tb
        de_tai.save(update_fields=["TrangThai", "DiemTongHop"])

        return Response({
            "message"      : f"Đề tài [{de_tai.MaDeTai}] đã nghiệm thu thành công.",
            "TrangThai"    : de_tai.get_TrangThai_display(),
            "DiemTongHop"  : diem_tb,
            "XepLoaiChung" : dict(DanhGia.XepLoaiChoices.choices).get(xep_loai),
            "SoPhieuCham"  : danh_sach_dg.count(),
        })

    @action(detail=True, methods=["get"], url_path="ket-qua-danh-gia")
    def ket_qua_danh_gia(self, request, pk=None):
        de_tai = self.get_object() 

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

    @action(detail=True, methods=["patch"], url_path="phan-cong-hoi-dong")
    def phan_cong_hoi_dong(self, request, pk=None):
        de_tai = self.get_object()
        
        # Chỉ đề tài đang chờ nghiệm thu hoặc đang thực hiện mới phân công HĐ được
        if de_tai.TrangThai not in [DeTai.TrangThaiDeTai.DANGTHUCHIEN, DeTai.TrangThaiDeTai.CHONGHIEMTHU]:
            raise ValidationError(
                f"Không thể phân công hội đồng lúc này. Trạng thái hiện tại: '{de_tai.get_TrangThai_display()}'."
            )

        serializer = PhanCongHoiDongSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ma_hoi_dong = serializer.validated_data["MaHoiDong"]
        hoi_dong = get_object_or_404(HoiDong, pk=ma_hoi_dong)

        # 🌟 THUẬT TOÁN CHẶN XUNG ĐỘT LỢI ÍCH (CONFLICT OF INTEREST)
        # 1. Lấy danh sách mã GV đang ngồi trong Hội đồng này
        thanh_vien_hd_ids = set(ThanhVienHoiDong.objects.filter(MaHoiDong=hoi_dong).values_list("MaGV_id", flat=True))
        
        # 2. Lấy danh sách mã GV đang Hướng dẫn đề tài này
        gv_huong_dan_ids = set(HuongDan.objects.filter(MaDeTai=de_tai).values_list("MaGV_id", flat=True))

        # 3. Tìm phần giao nhau (Có ông GV nào vừa hướng dẫn vừa ngồi hội đồng không?)
        conflict_gvs = thanh_vien_hd_ids.intersection(gv_huong_dan_ids)
        
        if conflict_gvs:
            # Lấy tên của GV vi phạm đầu tiên để báo lỗi cho thân thiện
            from .models import GiangVien
            gv_loi = GiangVien.objects.filter(MaGV__in=conflict_gvs).first()
            raise ValidationError(
                f"Vi phạm quy chế: Giảng viên {gv_loi.TenGV} ({gv_loi.MaGV}) đang là người hướng dẫn đề tài này, "
                f"do đó không thể phân công đề tài vào Hội đồng {hoi_dong.MaHoiDong}."
            )

        # Gắn hội đồng vào đề tài nếu an toàn
        de_tai.MaHoiDong = hoi_dong
        de_tai.save(update_fields=["MaHoiDong"])

        

        return Response({
            "message": f"Đã phân công Hội đồng [{hoi_dong.MaHoiDong}] đánh giá Đề tài [{de_tai.MaDeTai}].",
            "MaHoiDong": hoi_dong.MaHoiDong,
            "TenHoiDong": hoi_dong.TenHoiDong
        }, status=status.HTTP_200_OK)


    def get_permissions(self):
        if self.action == "create":
            return [IsSinhVien()]

        # Đã cập nhật đầy đủ tên hàm tại đây
        if self.action in ["duyet_de_tai", "tu_choi_de_tai", "xac_nhan_huong_dan", "tu_choi_huong_dan"]:
            return [IsAuthenticated()]

        HANH_DONG_CAN_BO = [
            "update", "partial_update", "destroy",
            "gui_len_hoi_dong", "phan_cong_hoi_dong", 
            "them_thanh_vien_hoi_dong", "nghiem_thu"
        ]
        if self.action in HANH_DONG_CAN_BO:
            return [IsCanBoQuanLy()]

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
            # BẮT BUỘC PHẢI CÓ 2 DÒNG NÀY ĐỂ XEM ĐƯỢC CẢ LỚP
            if self.action == "list":
                return base_qs.all()
            return base_qs.filter(TenDangNhap_id=user.username)

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
        if self.action == "create":
            return [IsSinhVien()]

        # THÊM TÊN 2 HÀM MỚI VÀO ĐÂY ĐỂ CHO PHÉP ĐI QUA
        if self.action in ["duyet_de_tai", "tu_choi_de_tai", "xac_nhan_huong_dan", "tu_choi_huong_dan"]:
            return [IsAuthenticated()] 

        HANH_DONG_CAN_BO = [
            "update", "partial_update", "destroy",
            "gui_len_hoi_dong", "phan_cong_hoi_dong", 
            "them_thanh_vien_hoi_dong", "nghiem_thu",
        ]
        if self.action in HANH_DONG_CAN_BO:
            return [IsCanBoQuanLy()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        vai_tro = _get_vai_tro(user)
        base_qs = HuongDan.objects.select_related("MaDeTai", "MaGV")
        
        if vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            gv = _get_giang_vien(user)
            if gv is None:
                return HuongDan.objects.none()
            
            # CHỈ HIỂN THỊ LỜI MỜI KHI CÁN BỘ ĐÃ DUYỆT (CHO_XAC_NHAN_GV)
            return base_qs.filter(
                MaGV=gv,
                MaDeTai__TrangThai=DeTai.TrangThaiDeTai.CHO_XAC_NHAN_GV,
                TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.CHO_XAC_NHAN
            )
            
        return base_qs.all()
    # ═══════════════════════════════════════════════════════════════════════
    # [GIẢNG VIÊN] ĐỒNG Ý hướng dẫn đề tài
    # PATCH /api/de-tai/{MaDeTai}/xac-nhan/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="xac-nhan")
    def xac_nhan_huong_dan(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được xác nhận hướng dẫn.")

        # pk ở đây chính là MaDeTai (VD: DT001)
        de_tai = self.get_object() 
        giang_vien = _get_giang_vien(request.user)

        # Truy tìm bản ghi Hướng Dẫn liên kết giữa Đề tài này và Giảng viên này
        from django.shortcuts import get_object_or_404
        huong_dan = get_object_or_404(HuongDan, MaDeTai=de_tai, MaGV=giang_vien)

        # Cập nhật trạng thái
        huong_dan.TrangThaiXacNhan = HuongDan.TrangThaiLoiMoi.DA_XAC_NHAN
        huong_dan.save(update_fields=["TrangThaiXacNhan"])

        de_tai.TrangThai = DeTai.TrangThaiDeTai.DANGTHUCHIEN
        de_tai.save(update_fields=["TrangThai"])

        sv_chu_nhiem = de_tai.sinh_viens.first()
        if sv_chu_nhiem:
            ThongBao.objects.create(
                TenDangNhap=sv_chu_nhiem.TenDangNhap,
                NoiDung=f"Chúc mừng! Giảng viên {giang_vien.TenGV} đã chấp nhận hướng dẫn đề tài '{de_tai.TenDeTai}' của nhóm bạn. Đề tài đã được kích hoạt thực hiện.",
                Loai=ThongBao.LoaiThongBao.DE_TAI )

        return Response({"message": "Thầy/Cô đã chấp nhận hướng dẫn. Đề tài đã chính thức được kích hoạt."})

    # ═══════════════════════════════════════════════════════════════════════
    # [GIẢNG VIÊN] TỪ CHỐI hướng dẫn đề tài
    # PATCH /api/de-tai/{MaDeTai}/tu-choi-gv/
    # ═══════════════════════════════════════════════════════════════════════
    @action(detail=True, methods=["patch"], url_path="tu-choi")
    def tu_choi_huong_dan(self, request, pk=None):
        vai_tro = _get_vai_tro(request.user)
        if vai_tro != TaiKhoan.QuyenHanChoices.GIANG_VIEN:
            raise PermissionDenied("Chỉ Giảng viên mới được từ chối hướng dẫn.")

        de_tai = self.get_object()
        giang_vien = _get_giang_vien(request.user)

        huong_dan = get_object_or_404(HuongDan, MaDeTai=de_tai, MaGV=giang_vien)

        huong_dan.TrangThaiXacNhan = HuongDan.TrangThaiLoiMoi.TU_CHOI
        huong_dan.save(update_fields=["TrangThaiXacNhan"])

        de_tai.TrangThai = DeTai.TrangThaiDeTai.GV_TU_CHOI
        de_tai.save(update_fields=["TrangThai"])

        sv_chu_nhiem = de_tai.sinh_viens.first()
        if sv_chu_nhiem: ThongBao.objects.create(
            TenDangNhap=sv_chu_nhiem.TenDangNhap,
            NoiDung=f"Cảnh báo: Giảng viên đã từ chối hướng dẫn đề tài '{de_tai.TenDeTai}'. Vui lòng vào không gian quản lý để tiến hành đề xuất Giảng viên mới.",
            Loai=ThongBao.LoaiThongBao.DE_TAI
        ) 



        return Response({"message": "Thầy/Cô đã từ chối hướng dẫn. Sinh viên sẽ nhận được thông báo để đổi Giảng viên khác."})

    # ═══════════════════════════════════════════════════════════════════════
    # [GIẢNG VIÊN] ĐỒNG Ý hướng dẫn đề tài
    # PATCH /api/huong-dan/{MaHuongDan}/xac-nhan/
    # ═══════════════════════════════════════════════════════════════════════
    


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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
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
            
        if sv.MaDeTai.TrangThai != DeTai.TrangThaiDeTai.DANGTHUCHIEN:
            raise ValidationError(
                f"Chỉ cập nhật tiến độ khi đề tài đang 'Thực Hiện'. "
                f"Hiện tại: '{sv.MaDeTai.get_TrangThai_display()}'."
            )
            
        ty_le = serializer.validated_data.get("TyLeHoanThanh", 0)
        if not (0 <= ty_le <= 100):
            raise ValidationError("Tỷ lệ hoàn thành phải trong khoảng 0–100%.")
            
        # 1. Lưu bản ghi tiến độ vào Database
        tien_do = serializer.save(MaDeTai=sv.MaDeTai)

        # 🌟 2. THÊM MỚI: BẮN THÔNG BÁO CHO GIẢNG VIÊN HƯỚNG DẪN
        from .models import HuongDan, ThongBao
        
        # Lùng tìm xem Giảng viên nào đã bấm "Đã đồng ý hướng dẫn" đề tài này
        ds_huong_dan = HuongDan.objects.filter(
            MaDeTai=sv.MaDeTai,
            TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.DA_XAC_NHAN
        ).select_related('MaGV')

        # Duyệt qua danh sách để bắn thông báo (Phòng hờ trường hợp đề tài có đồng hướng dẫn)
        for hd in ds_huong_dan:
            ThongBao.objects.create(
                TenDangNhap_id=hd.MaGV.TenDangNhap_id, # Tài khoản nhận là của GVHD
                NoiDung=f"Sinh viên {sv.TenSV} (Lớp {sv.Lop}) vừa nộp báo cáo tiến độ định kỳ mới: Đạt {ty_le}% khối lượng công việc. Vui lòng vào soát xét và cho điểm.",
                Loai=ThongBao.LoaiThongBao.TIEN_DO
            )

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
            TrangThaiXacNhan=HuongDan.TrangThaiLoiMoi.DA_XAC_NHAN,
        ).exists()

        
        if not co_phu_trach:
            raise PermissionDenied(
                "Bạn không phụ trách đề tài này hoặc chưa xác nhận hướng dẫn."
            )

        # Lưu nhận xét kèm thời gian
        tien_do.NhanXetGVHD = serializer.validated_data["NhanXetGVHD"]
        tien_do.DiemGVHD = request.data.get("DiemGVHD", tien_do.DiemGVHD)
        tien_do.NgayNhanXet  = timezone.now()
        tien_do.save(update_fields=["NhanXetGVHD", "NgayNhanXet", "DiemGVHD"])

        sv_chu_nhiem = tien_do.MaDeTai.sinh_viens.first()
        if sv_chu_nhiem:
            ThongBao.objects.create(
                TenDangNhap=sv_chu_nhiem.TenDangNhap,
                NoiDung=f"Giảng viên hướng dẫn đã cập nhật nhận xét và chấm điểm tiến độ định kỳ đạt {tien_do.TyLeHoanThanh}% cho đề tài của bạn.",
                Loai=ThongBao.LoaiThongBao.TIEN_DO
            ) 


        return Response({
            "message"    : "Đã lưu nhận xét thành công.",
            "MaTienDo"   : tien_do.MaTienDo,
            "NhanXetGVHD": tien_do.NhanXetGVHD,
            "DiemGVHD"  : tien_do.DiemGVHD,
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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
                
                context["user_co_quyen_xem_file"] = True
            # elif vai_tro == TaiKhoan.QuyenHanChoices.GIANG_VIEN:
                
            #     context["user_co_quyen_xem_file"] = True

            giang_vien = _get_giang_vien(user)
            co_trong_hoi_dong = ThanhVienHoiDong.objects.filter(MaGV=giang_vien).exists()
            context["user_co_quyen_xem_file"] = co_trong_hoi_dong
        return context
    
    @action(detail=True, methods=["post"], url_path="chot-nghiem-thu")
    def chot_nghiem_thu(self, request, pk=None):
        bao_cao = self.get_object()
        de_tai = DeTai.objects.get(pk=bao_cao.MaDeTai_id)
        if bao_cao.DiemTrungBinh is not None:
            raise ValidationError("Điểm đã được tổng hợp trước đó. Không thể tổng hợp lại.")

        
        # 1. Bắt lỗi: Chỉ chốt khi đang ở trạng thái chờ
        if de_tai.TrangThai not in [
            DeTai.TrangThaiDeTai.CHONGHIEMTHU,
            DeTai.TrangThaiDeTai.DANGHIEMTHU
        ]:
            raise ValidationError("Đề tài này không ở trạng thái chờ nghiệm thu!")


        from .models import DanhGia
        from django.db.models import Avg
        
        # 🌟 2. LẤY PHIẾU ĐIỂM (Sửa thành MaDeTai_id để Django query chuẩn xác 100%)
        phieu_diem = DanhGia.objects.filter(MaDeTai_id=de_tai.MaDeTai)
        
        if phieu_diem.count() == 0:
            raise ValidationError("Chưa có giảng viên nào chấm điểm đề tài này!")


        # 🌟 3. TÍNH ĐIỂM TRUNG BÌNH (Đã sửa đồng bộ tên biến phieu_diem)
        diem_tb = phieu_diem.aggregate(Avg('DiemSo'))['DiemSo__avg']
        
        if diem_tb is None:
            raise ValidationError("Lỗi hệ thống: Không thể tính được điểm trung bình.")
            
        diem_tb_lam_tron = round(diem_tb, 2)


        # 4. Ghi điểm vào Bảng Báo Cáo
        bao_cao.DiemTrungBinh = diem_tb_lam_tron
        bao_cao.save(update_fields=['DiemTrungBinh'])


        # 5. Cập nhật trạng thái và Điểm chung cuộc cho Bảng Đề Tài (Rất quan trọng để Sinh viên thấy điểm)
        de_tai.TrangThai = DeTai.TrangThaiDeTai.DANGHIEMTHU
        de_tai.DiemTongHop = diem_tb_lam_tron
        de_tai.save(update_fields=['TrangThai', 'DiemTongHop'])


        return Response({
            "message": f"Đã chốt điểm và nghiệm thu thành công! Điểm chung cuộc: {diem_tb_lam_tron}",
            "DiemTrungBinh": diem_tb_lam_tron
        })





    def perform_create(self, serializer):
        # 1. Lưu báo cáo vào Database
        ma_de_tai_tu_frontend = self.request.data.get("MaDeTai")
        
        # CHỈ CẦN TRUYỀN NGÀY NỘP VÀ MÃ ĐỀ TÀI, XÓA HẲN CHỮ 'DiemTrungBinh' ĐI NÉ
        bao_cao = serializer.save(
            NgayNop=timezone.now(),
            MaDeTai_id=ma_de_tai_tu_frontend
        )

        # 2. Lấy cái đề tài của báo cáo đó ra
        de_tai = bao_cao.MaDeTai
        
        # 3. Tự động đổi trạng thái đề tài sang CHỜ NGHIỆM THU
        from .models import DeTai
        de_tai.TrangThai = DeTai.TrangThaiDeTai.CHONGHIEMTHU 
        de_tai.save(update_fields=['TrangThai'])
        from .models import CanBoQuanLy
        ds_can_bo = CanBoQuanLy.objects.values_list('TenDangNhap_id', flat=True)
        for cb_id in ds_can_bo:
            ThongBao.objects.create(
                TenDangNhap_id=cb_id, NoiDung=f"Đề tài [{de_tai.MaDeTai}] đã chốt nộp báo cáo toàn văn cuối kỳ. Hệ thống đang chờ phân công Hội đồng nghiệm thu.",
                Loai=ThongBao.LoaiThongBao.HOI_DONG
            ) 

    @action(detail=True, methods=["patch"], url_path="phan-cong-hoi-dong")
    def phan_cong_hoi_dong(self, request, pk=None):
        from .models import HoiDong, GiangVien, ThanhVienHoiDong
        bao_cao = self.get_object()
        ma_hoi_dong = request.data.get("MaHoiDong")
        
        if not ma_hoi_dong:
            return Response({"error": "Thiếu mã Hội đồng"}, status=400)
            
        from .models import HoiDong
        hoi_dong = get_object_or_404(HoiDong, pk=ma_hoi_dong)
        thanh_vien_hd_ids = set(ThanhVienHoiDong.objects.filter(MaHoiDong=hoi_dong).values_list("MaGV_id", flat=True))

        gv_huong_dan_ids = set(HuongDan.objects.filter(MaDeTai=bao_cao.MaDeTai).values_list("MaGV_id", flat=True))
        
        conflict = thanh_vien_hd_ids.intersection(gv_huong_dan_ids)
        if conflict:
            gv_loi = GiangVien.objects.filter(MaGV__in=conflict).first()
            raise ValidationError(f"Vi phạm quy chế: {gv_loi.TenGV} ({gv_loi.MaGV}) đang là GVHD của đề tài này, không thể phân công vào Hội đồng {hoi_dong.MaHoiDong}.")

        # Gán báo cáo này cho Hội đồng đó
        bao_cao.MaHoiDong = hoi_dong
        bao_cao.save(update_fields=["MaHoiDong"])
        bao_cao.MaDeTai.MaHoiDong = hoi_dong
        bao_cao.MaDeTai.save(update_fields=["MaHoiDong"])
        de_tai = bao_cao.MaDeTai
        sv_chu_nhiem = de_tai.sinh_viens.first()
        if sv_chu_nhiem:
            ThongBao.objects.create(
                TenDangNhap=sv_chu_nhiem.TenDangNhap,
                NoiDung=f"Đề tài của bạn đã được phân phối về Hội đồng nghiệm thu [{hoi_dong.MaHoiDong} - {hoi_dong.TenHoiDong}]. Hãy chuẩn bị hồ sơ bảo vệ.",
                Loai=ThongBao.LoaiThongBao.HOI_DONG
        )

        from .models import ThanhVienHoiDong
        thanh_viens = ThanhVienHoiDong.objects.filter(MaHoiDong=hoi_dong).select_related('MaGV')
        for tv in thanh_viens:
            ThongBao.objects.create(
                TenDangNhap_id=tv.MaGV.TenDangNhap_id,
                NoiDung=f"Hệ thống phân công: Thầy/Cô có lịch chấm nghiệm thu đề tài '{de_tai.TenDeTai}' với vai trò {tv.get_VaiTroHD_display() if hasattr(tv, 'get_VaiTroHD_display') else tv.VaiTroHD}.",
                Loai=ThongBao.LoaiThongBao.HOI_DONG
            )

        return Response({
            "message": f"Đã phân công Báo cáo [{bao_cao.MaBaoCao}] cho Hội đồng [{hoi_dong.MaHoiDong}] chấm điểm."
        })

# ═══════════════════════════════════════════════════════════════════════════════
# 9. HỘI ĐỒNG — /api/hoi-dong/
# ═══════════════════════════════════════════════════════════════════════════════
class HoiDongViewSet(BaseViewSet):
    queryset         = HoiDong.objects.all()
    serializer_class = HoiDongSerializer
    search_fields    = ["MaHoiDong", "TenHoiDong", "QuyetDinh"]
    pagination_class = NhoPagination    # Override: 5 bản ghi/trang

    def get_permissions(self):
        # Chỉ Cán bộ quản lý mới được lập, sửa, xóa Hội đồng
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        # SỬA LẠI HÀM NÀY: Dùng Serializer mới cho lúc lập Hội đồng
        if self.action == "create":
            return HoiDongTaoMoiSerializer
        return HoiDongSerializer

    def get_queryset(self):
        return HoiDong.objects.all()


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ĐÁNH GIÁ — /api/danh-gia/
# ═══════════════════════════════════════════════════════════════════════════════
# api/views.py — THAY THẾ TOÀN BỘ class DanhGiaViewSet cũ

from .serializers import DanhGiaChamDiemSerializer, DanhGiaXemSerializer


class DanhGiaViewSet(BaseViewSet):
    filterset_fields = ["MaDeTai", "MaHoiDong"]
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

        if de_tai.TrangThai != DeTai.TrangThaiDeTai.CHONGHIEMTHU:
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

            de_tai.TrangThai   = DeTai.TrangThaiDeTai.DANGHIEMTHU
            de_tai.DiemTongHop = diem_tb
            de_tai.save(update_fields=["TrangThai", "DiemTongHop"])
            sv_chu_nhiem = de_tai.sinh_viens.first()
            if sv_chu_nhiem:
                ThongBao.objects.create(
                    TenDangNhap=sv_chu_nhiem.TenDangNhap,
                    NoiDung=f"Tin chốt: Đề tài của bạn đã hoàn tất quá trình nghiệm thu. Điểm tổng hợp cuối cùng của Hội đồng: {diem_tb} điểm. Xếp loại: {xep_loai_tb}.",
                    Loai=ThongBao.LoaiThongBao.HOI_DONG
            )

    

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
    
from .models import TaiLieu
from .serializers import TaiLieuSerializer

# ═══════════════════════════════════════════════════════════════════════════════
# X. THƯ VIỆN VĂN BẢN — /api/tai-lieu/
# ═══════════════════════════════════════════════════════════════════════════════
class TaiLieuViewSet(BaseViewSet):
    queryset = TaiLieu.objects.all()
    serializer_class = TaiLieuSerializer
    # Hỗ trợ nhận cả dữ liệu JSON thường và định dạng File đính kèm Multipart form
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ["TenTaiLieu"]
    filterset_fields = ["Loai"]

    def get_permissions(self):
        # Chỉ có Cán bộ quản lý mới có quyền Thêm, Sửa, Xóa tài liệu
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsCanBoQuanLy()]
        # Tất cả các vai trò khác (Sinh viên, Giảng viên) sau khi đăng nhập đều được vào xem công khai
        return [IsAuthenticated()]
    

# Thêm vào file api/views.py
from .models import ThongBao
from .serializers import ThongBaoSerializer

class ThongBaoViewSet(BaseViewSet):
    serializer_class = ThongBaoSerializer
    pagination_class = NhoPagination # Hiện khoảng 5-10 thông báo mỗi lần load
    from rest_framework import status
    from rest_framework.response import Response
    from rest_framework.decorators import action
    from rest_framework.exceptions import PermissionDenied



    # 1. Hàm xóa từng thông báo (Ghi đè hàm destroy mặc định để bảo mật)
    def destroy(self, request, *args, **kwargs):
        thong_bao = self.get_object()
        # Chặn không cho người này xóa thông báo của người khác
        if thong_bao.TenDangNhap != request.user:
            raise PermissionDenied("Bạn không có quyền xóa thông báo này.")
        
        self.perform_destroy(thong_bao)
        return Response({"message": "Đã xóa thông báo thành công."}, status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        # Lọc thông minh: Ai đăng nhập thì chỉ thấy thông báo của người đó
        user = self.request.user
        return ThongBao.objects.filter(TenDangNhap_id=user.username)

    # 2. Hàm dọn dẹp sạch sẽ (Xóa tất cả thông báo của user đang đăng nhập)
    @action(detail=False, methods=['delete'], url_path='xoa-tat-ca')
    def xoa_tat_ca(self, request):
        from .models import ThongBao
        # Quét và xóa toàn bộ thông báo thuộc về user này
        so_luong, _ = ThongBao.objects.filter(TenDangNhap_id=request.user.username).delete()
        return Response({
            "message": f"Đã xóa toàn bộ {so_luong} thông báo."
        }, status=status.HTTP_200_OK)

    # API phụ: Bấm nút "Đánh dấu đã đọc tất cả"
    @action(detail=False, methods=["post"], url_path="doc-het")
    def doc_het(self, request):
        user = self.request.user
        ThongBao.objects.filter(TenDangNhap_id=user.username, IsRead=False).update(IsRead=True)
        return Response({"message": "Đã đánh dấu đọc tất cả thông báo."})


