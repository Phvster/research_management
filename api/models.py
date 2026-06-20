# api/models.py

from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError as DjangoValidationError

# ═══════════════════════════════════════════════════════════════════════════════
# 1. TÀI KHOẢN
# Bảng trung tâm xác thực, tách biệt khỏi thông tin hồ sơ người dùng.
# Mỗi TaiKhoan sẽ liên kết 1-1 với đúng 1 trong 3 bảng hồ sơ bên dưới.
# ═══════════════════════════════════════════════════════════════════════════════
class TaiKhoan(models.Model):

    class QuyenHanChoices(models.TextChoices):
        SINH_VIEN  = "SINHVIEN",  "Sinh Viên"
        GIANG_VIEN = "GIANGVIEN", "Giảng Viên"
        QUAN_LY    = "QUANLY",    "Cán Bộ Quản Lý"

    # Dùng TenDangNhap làm PK thay cho AutoField để dễ đọc và tra cứu
    TenDangNhap = models.CharField(
        max_length=50,
        primary_key=True,
        verbose_name="Tên đăng nhập",
    )
    # Lưu hash, KHÔNG BAO GIỜ lưu mật khẩu thô
    MatKhauHash = models.CharField(
        max_length=255,
        verbose_name="Mật khẩu (hash)",
    )
    QuyenHan = models.CharField(
        max_length=20,
        choices=QuyenHanChoices.choices,
        verbose_name="Quyền hạn",
    )
    # 1 = Hoạt động, 0 = Bị khóa — dùng IntegerField theo thiết kế gốc
    TrangThai = models.IntegerField(
        default=1,
        verbose_name="Trạng thái",
    )

    class Meta:
        db_table  = "TaiKhoan"
        verbose_name = "Tài Khoản"
        verbose_name_plural = "Danh Sách Tài Khoản"

    def __str__(self):
        return f"{self.TenDangNhap} ({self.get_QuyenHan_display()})"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ĐỀ TÀI
# Thực thể trung tâm của toàn bộ hệ thống.
# Đặt lên trước SinhVien để SinhVien có thể FK vào đây.
# ═══════════════════════════════════════════════════════════════════════════════
class DeTai(models.Model):

    class TrangThaiDeTai(models.TextChoices):
        CHO_DUYET        = "CHODUYET",       "Chờ Duyệt"
        DANG_THUC_HIEN   = "DANGTHUCHIEN",   "Đang Thực Hiện"
        CHO_NGHIEM_THU   = "CHONGHIEMTHU",   "Chờ Nghiệm Thu"
        DA_NGHIEM_THU   = "DANGHIEMTHU",   "Đã Nghiệm Thu"   # ← Thêm mới
        TU_CHOI         = "TUCHOI",        "Từ Chối"

    MaDeTai = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã đề tài",
    )
    TenDeTai = models.CharField(
        max_length=255,
        verbose_name="Tên đề tài",
    )
    TomTat = models.TextField(
        verbose_name="Tóm tắt",
    )
    TrangThai = models.CharField(
        max_length=20,
        choices=TrangThaiDeTai.choices,
        default=TrangThaiDeTai.CHO_DUYET,
        verbose_name="Trạng thái",
    )

    MaHoiDong = models.ForeignKey(        
        "HoiDong",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="de_tais",
        verbose_name="Hội đồng đánh giá",
    )
    DiemTongHop = models.FloatField(null=True, blank=True)  
    LyDoTuChoi  = models.TextField(blank=True, default="")  
    NgayTao = models.DateTimeField(auto_now_add=True, verbose_name="Ngày đăng ký", null=True)

    class Meta:
        db_table = "DeTai"
        verbose_name = "Đề Tài"
        verbose_name_plural = "Danh Sách Đề Tài"

    def __str__(self):
        return f"[{self.MaDeTai}] {self.TenDeTai}"


# ═══════════════════════════════════════════════════════════════════════════════
# 3. SINH VIÊN
# ═══════════════════════════════════════════════════════════════════════════════
class SinhVien(models.Model):

    MaSV = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã sinh viên",
    )
    # on_delete=CASCADE: xóa TaiKhoan → xóa luôn hồ sơ SinhVien
    TenDangNhap = models.OneToOneField(
        TaiKhoan,
        on_delete=models.CASCADE,
        db_column="TenDangNhap",
        related_name="sinh_vien",
        verbose_name="Tài khoản",
    )
    # SET_NULL: sinh viên có thể chưa có đề tài, hoặc đề tài bị hủy
    # mà không làm mất hồ sơ sinh viên
    MaDeTai = models.ForeignKey(
        DeTai,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="MaDeTai",
        related_name="sinh_viens",
        verbose_name="Đề tài",
    )
    TenSV = models.CharField(
        max_length=100,
        verbose_name="Họ và tên",
    )
    Lop = models.CharField(
        max_length=20,
        verbose_name="Lớp",
    )
    Khoa = models.CharField(
        max_length=100,
        verbose_name="Khoa",
    )

    class Meta:
        db_table = "SinhVien"
        verbose_name = "Sinh Viên"
        verbose_name_plural = "Danh Sách Sinh Viên"

    def __str__(self):
        return f"{self.MaSV} - {self.TenSV} ({self.Lop})"


# ═══════════════════════════════════════════════════════════════════════════════
# 4. GIẢNG VIÊN
# ═══════════════════════════════════════════════════════════════════════════════
class GiangVien(models.Model):

    MaGV = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã giảng viên",
    )
    TenDangNhap = models.OneToOneField(
        TaiKhoan,
        on_delete=models.CASCADE,
        db_column="TenDangNhap",
        related_name="giang_vien",
        verbose_name="Tài khoản",
    )
    TenGV = models.CharField(
        max_length=100,
        verbose_name="Họ và tên",
    )
    # Ví dụ: "TS.", "PGS.TS.", "ThS."
    HocHamHocVi = models.CharField(
        max_length=50,
        verbose_name="Học hàm/Học vị",
    )

    class Meta:
        db_table = "GiangVien"
        verbose_name = "Giảng Viên"
        verbose_name_plural = "Danh Sách Giảng Viên"

    def __str__(self):
        return f"{self.HocHamHocVi} {self.TenGV} ({self.MaGV})"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CÁN BỘ QUẢN LÝ
# ═══════════════════════════════════════════════════════════════════════════════
class CanBoQuanLy(models.Model):

    MaCB = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã cán bộ",
    )
    TenDangNhap = models.OneToOneField(
        TaiKhoan,
        on_delete=models.CASCADE,
        db_column="TenDangNhap",
        related_name="can_bo",
        verbose_name="Tài khoản",
    )
    TenCB = models.CharField(
        max_length=100,
        verbose_name="Họ và tên",
    )
    PhongBan = models.CharField(
        max_length=100,
        verbose_name="Phòng/Ban",
    )

    class Meta:
        db_table = "CanBoQuanLy"
        verbose_name = "Cán Bộ Quản Lý"
        verbose_name_plural = "Danh Sách Cán Bộ Quản Lý"

    def __str__(self):
        return f"{self.TenCB} - {self.PhongBan} ({self.MaCB})"


# ═══════════════════════════════════════════════════════════════════════════════
# 6. HƯỚNG DẪN (Bảng trung gian GiangVien ↔ DeTai)
# Một đề tài có thể có nhiều giảng viên hướng dẫn với vai trò khác nhau
# (Chủ nhiệm, Đồng hướng dẫn...). Dùng AutoField thay vì CharField cho PK.
# ═══════════════════════════════════════════════════════════════════════════════
class HuongDan(models.Model):

    # AutoField: Django tự tăng, phù hợp cho bảng trung gian
    MaHuongDan = models.AutoField(
        primary_key=True,
        verbose_name="Mã hướng dẫn",
    )
    # CASCADE: xóa đề tài → xóa luôn bản ghi hướng dẫn liên quan
    MaDeTai = models.ForeignKey(
        DeTai,
        on_delete=models.CASCADE,
        db_column="MaDeTai",
        related_name="huong_dans",
        verbose_name="Đề tài",
    )
    # CASCADE: xóa giảng viên → xóa luôn bản ghi hướng dẫn của họ
    MaGV = models.ForeignKey(
        GiangVien,
        on_delete=models.CASCADE,
        db_column="MaGV",
        related_name="huong_dans",
        verbose_name="Giảng viên",
    )
    VaiTro = models.CharField(
        max_length=50,
        verbose_name="Vai trò",
        # Ví dụ: "Chủ nhiệm", "Đồng hướng dẫn"
    )
    # Giảng viên xác nhận nhận hướng dẫn
    DaXacNhan  = models.BooleanField(default=False)  # ← Thêm mới
    NgayXacNhan = models.DateTimeField(null=True, blank=True) # ← Thêm mới

    class Meta:
        db_table = "HuongDan"
        verbose_name = "Phân Công Hướng Dẫn"
        verbose_name_plural = "Danh Sách Hướng Dẫn"
        # Ràng buộc: mỗi GV chỉ hướng dẫn 1 đề tài với 1 vai trò
        unique_together = ("MaDeTai", "MaGV")

    def __str__(self):
        return f"{self.MaGV} hướng dẫn [{self.MaDeTai}] — {self.VaiTro}"


# ═══════════════════════════════════════════════════════════════════════════════
# 7. TIẾN ĐỘ
# Nhật ký cập nhật tiến độ thực hiện đề tài theo từng mốc thời gian.
# ═══════════════════════════════════════════════════════════════════════════════
class TienDo(models.Model):

    MaTienDo = models.AutoField(
        primary_key=True,
        verbose_name="Mã tiến độ",
    )
    # CASCADE: xóa đề tài → xóa toàn bộ lịch sử tiến độ liên quan
    MaDeTai = models.ForeignKey(
        DeTai,
        on_delete=models.CASCADE,
        db_column="MaDeTai",
        related_name="tien_dos",
        verbose_name="Đề tài",
    )
    # 0–100 (%)
    TyLeHoanThanh = models.IntegerField(
        verbose_name="Tỷ lệ hoàn thành (%)",
    )
    NoiDung = models.TextField(
        verbose_name="Nội dung cập nhật",
    )
    # Lưu đường dẫn tương đối đến file minh chứng trên server
    # Ví dụ: "uploads/tiendo/de_tai_001_tuan3.pdf"
    FileMinhChung = models.FileField(
        upload_to="tien_do_files/%Y/%m/",
        blank=True,
        null=True,
        verbose_name="File minh chứng",
    )
    # Tự động ghi lại thời điểm cập nhật
    NgayCapNhat = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ngày cập nhật",
    )
    # Giảng viên nhận xét trực tiếp vào bản ghi tiến độ
    NhanXetGVHD   = models.TextField(blank=True, default="")   # ← Thêm mới
    NgayNhanXet   = models.DateTimeField(null=True, blank=True) # ← Thêm mới

    class Meta:
        db_table = "TienDo"
        verbose_name = "Tiến Độ"
        verbose_name_plural = "Nhật Ký Tiến Độ"
        ordering = ["-NgayCapNhat"]  # Mới nhất lên trên

    def __str__(self):
        return f"Tiến độ [{self.MaDeTai_id}] — {self.TyLeHoanThanh}% ({self.NgayCapNhat.strftime('%d/%m/%Y')})"


# ═══════════════════════════════════════════════════════════════════════════════
# 8. BÁO CÁO
# Báo cáo tổng kết nộp cuối đợt, bao gồm file và thông tin kiểm tra đạo văn.
# ═══════════════════════════════════════════════════════════════════════════════
def validate_file_size(file):
    """Giới hạn dung lượng file báo cáo tối đa 20MB."""
    max_size_mb = 20
    if file.size > max_size_mb * 1024 * 1024:
        raise DjangoValidationError(f"File không được vượt quá {max_size_mb}MB.")

class BaoCao(models.Model):

    MaBaoCao = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã báo cáo",
    )
    # CASCADE: xóa đề tài → xóa luôn báo cáo liên quan
    MaDeTai = models.ForeignKey(
        DeTai,
        on_delete=models.CASCADE,
        db_column="MaDeTai",
        related_name="bao_caos",
        verbose_name="Đề tài",
    )
    
    FileBaoCao = models.FileField(
        upload_to="bao_cao_files/%Y/%m/",   # Phân thư mục theo năm/tháng
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf", "doc", "docx"]),
            validate_file_size,
        ],
        verbose_name="File báo cáo",
        null=True,
        blank=True
    )

    # Tỷ lệ % đạo văn từ công cụ kiểm tra (có thể chưa có khi mới nộp)
    TyLeDaoVan = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Tỷ lệ đạo văn (%)",
    )
    NgayNop = models.DateTimeField(
        verbose_name="Ngày nộp",
    )

    class Meta:
        db_table = "BaoCao"
        verbose_name = "Báo Cáo"
        verbose_name_plural = "Danh Sách Báo Cáo"
        ordering = ["-NgayNop"]

    def __str__(self):
        return f"Báo cáo {self.MaBaoCao} — Đề tài [{self.MaDeTai_id}]"


# ═══════════════════════════════════════════════════════════════════════════════
# 9. HỘI ĐỒNG
# Hội đồng nghiệm thu được thành lập theo quyết định hành chính.
# ═══════════════════════════════════════════════════════════════════════════════
class HoiDong(models.Model):

    MaHoiDong = models.CharField(
        max_length=20,
        primary_key=True,
        verbose_name="Mã hội đồng",
    )
    TenHoiDong = models.CharField(
        max_length=200,
        verbose_name="Tên hội đồng",
    )
    # Số quyết định thành lập hội đồng (văn bản hành chính)
    QuyetDinh = models.CharField(
        max_length=100,
        verbose_name="Số quyết định",
    )

    class Meta:
        db_table = "HoiDong"
        verbose_name = "Hội Đồng"
        verbose_name_plural = "Danh Sách Hội Đồng"

    def __str__(self):
        return f"[{self.MaHoiDong}] {self.TenHoiDong}"


from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError as DjangoValidationError


# def validate_file_size(file):
#     """Giới hạn dung lượng file báo cáo tối đa 20MB."""
#     max_size_mb = 20
#     if file.size > max_size_mb * 1024 * 1024:
#         raise DjangoValidationError(f"File không được vượt quá {max_size_mb}MB.")


class ThanhVienHoiDong(models.Model):
    """
    Bảng trung gian: xác định CHÍNH XÁC những Giảng viên nào
    là thành viên của một Hội đồng. Đây là model còn thiếu khiến
    hệ thống trước đây không biết "5 người trong hội đồng là ai".
    """
    class VaiTroHD(models.TextChoices):
        CHU_TICH = "CHUTICH", "Chủ tịch Hội đồng"
        THU_KY   = "THUKY",   "Thư ký"
        UY_VIEN  = "UYVIEN",  "Ủy viên"

    MaThanhVien = models.AutoField(primary_key=True)
    MaHoiDong   = models.ForeignKey(
        HoiDong, on_delete=models.CASCADE, related_name="thanh_viens"
    )
    MaGV = models.ForeignKey(
        "GiangVien", on_delete=models.CASCADE, related_name="hoi_dong_thamgia"
    )
    VaiTro = models.CharField(max_length=20, choices=VaiTroHD.choices)

    class Meta:
        db_table = "ThanhVienHoiDong"
        # Một GV chỉ là thành viên của 1 hội đồng cụ thể đúng 1 lần
        unique_together = ("MaHoiDong", "MaGV")
        verbose_name = "Thành Viên Hội Đồng"
        verbose_name_plural = "Danh Sách Thành Viên Hội Đồng"

    def __str__(self):
        return f"{self.MaGV} — {self.get_VaiTro_display()} của {self.MaHoiDong}"




# ═══════════════════════════════════════════════════════════════════════════════
# 10. ĐÁNH GIÁ (Phiếu chấm điểm)
# Kết quả chấm điểm của một Hội đồng cho một Đề tài.
# Một hội đồng có thể đánh giá nhiều đề tài.
# ═══════════════════════════════════════════════════════════════════════════════
class DanhGia(models.Model):

    class XepLoaiChoices(models.TextChoices):
        XUAT_SAC  = "XUATSAC",  "Xuất Sắc"
        GIOI      = "GIOI",     "Giỏi"
        KHA       = "KHA",      "Khá"
        TRUNG_BINH = "TRUNGBINH", "Trung Bình"
        KHONG_DAT = "KHONGDAT", "Không Đạt"

    MaDanhGia = models.AutoField(
        primary_key=True,
        verbose_name="Mã đánh giá",
    )
    # SET_NULL: giải thể hội đồng không nên xóa kết quả đánh giá
    MaHoiDong = models.ForeignKey(
        HoiDong,
        on_delete=models.SET_NULL,
        null=True,
        db_column="MaHoiDong",
        related_name="danh_gias",
        verbose_name="Hội đồng",
    )
    # CASCADE: xóa đề tài → xóa luôn kết quả đánh giá
    MaDeTai = models.ForeignKey(
        DeTai,
        on_delete=models.CASCADE,
        db_column="MaDeTai",
        related_name="danh_gias",
        verbose_name="Đề tài",
    )
    # ── MỚI: gắn phiếu điểm với đúng thành viên đã chấm ────────────────────
    ThanhVienCham = models.ForeignKey(
        ThanhVienHoiDong,
        on_delete=models.CASCADE,
        related_name="phieu_diem",
        verbose_name="Thành viên chấm điểm",
        null=True,   # null=True để tương thích với dữ liệu cũ trước migration
    )

    # Thang điểm 0.0 – 10.0
    DiemSo = models.FloatField(
        verbose_name="Điểm số",
    )
    NhanXet = models.TextField(
        verbose_name="Nhận xét",
    )
    XepLoai = models.CharField(
        max_length=20,
        choices=XepLoaiChoices.choices,
        verbose_name="Xếp loại",
    )

    class Meta:
        db_table = "DanhGia"
        verbose_name = "Đánh Giá"
        verbose_name_plural = "Danh Sách Đánh Giá"
        # Một hội đồng chỉ đánh giá mỗi đề tài một lần
        unique_together = ("MaHoiDong", "MaDeTai")

    def __str__(self):
        return (
            f"Đánh giá [{self.MaDeTai_id}] "
            f"bởi HĐ {self.MaHoiDong_id} — "
            f"{self.DiemSo} điểm ({self.get_XepLoai_display()})"
        )

# api/models.py — THÊM VÀO CUỐI FILE

class BaiBaoNCKH(models.Model):
    """
    Model lưu trữ các bài báo / đề tài tiêu biểu hiển thị công khai
    trên Landing Page. Tách biệt hoàn toàn với luồng nghiệp vụ DeTai
    để tránh ảnh hưởng đến các ViewSet và permissions hiện có.
    """

    class GiaiThuongBaoCao(models.TextChoices):
        NHAT          = "NHAT",           "Giải Nhất"
        NHI           = "NHI",            "Giải Nhì"
        BA            = "BA",             "Giải Ba"
        KHUYEN_KHICH  = "KHUYENKHICH",    "Giải Khuyến Khích"
        XUAT_SAC      = "XUATSAC",        "Xuất Sắc"

    # ── Thông tin cơ bản ──────────────────────────────────────────────
    TenDeTai = models.CharField(
        max_length=300,
        verbose_name="Tên đề tài / bài báo",
    )
    TacGia = models.CharField(
        max_length=200,
        verbose_name="Tác giả / Chủ trì",
    )
    NamHoanThanh = models.PositiveIntegerField(
        verbose_name="Năm hoàn thành",
    )

    # ── Giải thưởng ───────────────────────────────────────────────────
    GiaiThuong = models.CharField(
        max_length=20,
        choices=GiaiThuongBaoCao.choices,
        verbose_name="Giải thưởng",
    )

    # ── Media ─────────────────────────────────────────────────────────
    # Dùng URLField để lưu link ảnh ngoài (picsum, unsplash...)
    # Sau này có thể đổi sang ImageField + storage backend
    AnhBia = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Ảnh bìa (URL)",
    )

    # ── Nội dung ──────────────────────────────────────────────────────
    # TomTat: Mô tả ngắn để hiển thị trên card
    TomTat = models.TextField(
        blank=True,
        default="",
        verbose_name="Tóm tắt (hiển thị trên card)",
    )
    # NoiDungChiTiet: HTML đầy đủ, hiện khi bấm "Xem chi tiết"
    NoiDungChiTiet = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung chi tiết (HTML)",
    )

    # ── Liên kết tùy chọn đến DeTai nội bộ ──────────────────────────
    # null=True: Bài báo landing page không cần phải có đề tài nội bộ
    DeTai = models.ForeignKey(
        "DeTai",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bai_baos",
        verbose_name="Đề tài nội bộ (nếu có)",
    )

    # ── Cờ kiểm soát hiển thị ─────────────────────────────────────────
    IsActive = models.BooleanField(
        default=True,
        verbose_name="Hiển thị trên trang chủ",
    )

    # ── Metadata ──────────────────────────────────────────────────────
    NgayTao = models.DateTimeField(auto_now_add=True)
    NgayCapNhat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table         = "BaiBaoNCKH"
        verbose_name     = "Bài Báo NCKH"
        verbose_name_plural = "Danh Sách Bài Báo NCKH"
        ordering         = ["-NamHoanThanh", "TenDeTai"]

    def __str__(self):
        return f"[{self.get_GiaiThuong_display()}] {self.TenDeTai} ({self.NamHoanThanh})"