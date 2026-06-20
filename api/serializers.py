# api/serializers.py

from rest_framework import serializers
from .models import (
    TaiKhoan, DeTai, SinhVien, GiangVien,
    CanBoQuanLy, HuongDan, TienDo,
    BaoCao, HoiDong, DanhGia, ThanhVienHoiDong
)


# ═══════════════════════════════════════════════════════════════════════════════
# SERIALIZERS "TÓM TẮT" (Nested nhúng vào serializer khác)
# Mục đích: Khi GET một bảng con, trả về thêm thông tin cơ bản của bảng cha
# thay vì chỉ trả về mã ID khô khan, giúp Frontend không cần gọi API thêm.
# ═══════════════════════════════════════════════════════════════════════════════

class TaiKhoanTomTatSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt TaiKhoan — dùng để nhúng vào hồ sơ người dùng."""
    class Meta:
        model  = TaiKhoan
        fields = ["TenDangNhap", "QuyenHan", "TrangThai"]


class DeTaiTomTatSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt DeTai — dùng để nhúng vào SinhVien, TienDo, BaoCao..."""
    class Meta:
        model  = DeTai
        fields = ["MaDeTai", "TenDeTai", "TrangThai"]


class GiangVienTomTatSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt GiangVien — dùng để nhúng vào HuongDan."""
    class Meta:
        model  = GiangVien
        fields = ["MaGV", "TenGV", "HocHamHocVi"]


class HoiDongTomTatSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt HoiDong — dùng để nhúng vào DanhGia."""
    class Meta:
        model  = HoiDong
        fields = ["MaHoiDong", "TenHoiDong"]


# ═══════════════════════════════════════════════════════════════════════════════
# 1. TÀI KHOẢN
# ═══════════════════════════════════════════════════════════════════════════════

class TaiKhoanSerializer(serializers.ModelSerializer):
    """
    Serializer đầy đủ cho TaiKhoan.
    MatKhauHash được đánh dấu write_only=True → không bao giờ trả về
    mật khẩu (dù đã hash) trong response GET, bảo vệ dữ liệu nhạy cảm.
    """
    MatKhauHash = serializers.CharField(write_only=True)

    class Meta:
        model  = TaiKhoan
        fields = ["TenDangNhap", "MatKhauHash", "QuyenHan", "TrangThai"]


# ═══════════════════════════════════════════════════════════════════════════════
# 2. ĐỀ TÀI
# ═══════════════════════════════════════════════════════════════════════════════

class DeTaiSerializer(serializers.ModelSerializer):
    """
    Serializer đầy đủ cho DeTai.
    TrangThai_display: trả về tên hiển thị tiếng Việt (vd: "Chờ Duyệt")
    thay vì mã nội bộ ("CHODUYET"), giúp Frontend hiển thị trực tiếp.
    """
    # source="get_TrangThai_display" gọi hàm Django tự sinh từ TextChoices
    TrangThai_display = serializers.CharField(
        source="get_TrangThai_display",
        read_only=True,
    )
    chu_nhiem = serializers.SerializerMethodField()
    gv_huong_dan = serializers.SerializerMethodField()

    class Meta:
        model  = DeTai
        fields = [
            "MaDeTai", "TenDeTai", "TomTat",
            "TrangThai", "TrangThai_display",
            "chu_nhiem", "gv_huong_dan"
        ]
    # THÊM 2 HÀM NÀY ĐỂ LẤY DATA DYNAMIC
    def get_chu_nhiem(self, obj):
        sv = obj.sinh_viens.first() # Dựa theo related_name="sinh_viens" trong model SinhVien
        return sv.TenSV if sv else "Chưa có"

    def get_gv_huong_dan(self, obj):
        hd = obj.huong_dans.first() # Dựa theo related_name="huong_dans" trong model HuongDan
        if hd and getattr(hd, 'MaGV', None):
            return f"{hd.MaGV.HocHamHocVi} {hd.MaGV.TenGV}".strip()
        return "Chưa phân công"

# ═══════════════════════════════════════════════════════════════════════════════
# 3. SINH VIÊN
# ═══════════════════════════════════════════════════════════════════════════════

class SinhVienSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho SinhVien:
    - tai_khoan_info: nhúng thông tin tài khoản (read-only)
    - de_tai_info:    nhúng thông tin đề tài đang thực hiện (read-only, nullable)

    Khi WRITE (POST/PUT/PATCH), Frontend vẫn gửi "TenDangNhap" và "MaDeTai"
    dưới dạng ID/string bình thường — DRF tự map qua trường gốc.
    """
    # Nested read-only: hiển thị thông tin bảng cha khi GET
    tai_khoan_info = TaiKhoanTomTatSerializer(
        source="TenDangNhap",   # trỏ đến field ForeignKey/OneToOne
        read_only=True,
    )
    de_tai_info = DeTaiTomTatSerializer(
        source="MaDeTai",       # trỏ đến field ForeignKey (nullable)
        read_only=True,
    )

    class Meta:
        model  = SinhVien
        fields = [
            "MaSV", "TenSV", "Lop", "Khoa",
            # ID để ghi (write)
            "TenDangNhap", "MaDeTai",
            # Object để đọc (read)
            "tai_khoan_info", "de_tai_info",
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# 4. GIẢNG VIÊN
# ═══════════════════════════════════════════════════════════════════════════════

class GiangVienSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho GiangVien:
    - tai_khoan_info: nhúng thông tin tài khoản (read-only)
    """
    tai_khoan_info = TaiKhoanTomTatSerializer(
        source="TenDangNhap",
        read_only=True,
    )

    class Meta:
        model  = GiangVien
        fields = [
            "MaGV", "TenGV", "HocHamHocVi",
            "TenDangNhap",
            "tai_khoan_info",
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CÁN BỘ QUẢN LÝ
# ═══════════════════════════════════════════════════════════════════════════════

class CanBoQuanLySerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho CanBoQuanLy:
    - tai_khoan_info: nhúng thông tin tài khoản (read-only)
    """
    tai_khoan_info = TaiKhoanTomTatSerializer(
        source="TenDangNhap",
        read_only=True,
    )

    class Meta:
        model  = CanBoQuanLy
        fields = [
            "MaCB", "TenCB", "PhongBan",
            "TenDangNhap",
            "tai_khoan_info",
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# 6. HƯỚNG DẪN
# ═══════════════════════════════════════════════════════════════════════════════

class HuongDanSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho HuongDan (bảng trung gian GiangVien ↔ DeTai):
    - de_tai_info:    nhúng tên và trạng thái đề tài
    - giang_vien_info: nhúng họ tên và học hàm giảng viên

    → Frontend nhận 1 request và có đủ thông tin để hiển thị bảng hướng dẫn,
      không cần gọi thêm API lấy tên đề tài hay tên giảng viên.
    """
    de_tai_info = DeTaiTomTatSerializer(
        source="MaDeTai",
        read_only=True,
    )
    giang_vien_info = GiangVienTomTatSerializer(
        source="MaGV",
        read_only=True,
    )

    class Meta:
        model  = HuongDan
        fields = [
            "MaHuongDan", "VaiTro",
            # ID để ghi
            "MaDeTai", "MaGV",
            # Object để đọc
            "de_tai_info", "giang_vien_info",
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# 7. TIẾN ĐỘ
# ═══════════════════════════════════════════════════════════════════════════════

class TienDoSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho TienDo:
    - de_tai_info: nhúng tên đề tài để Frontend hiển thị tiêu đề
    - NgayCapNhat: read_only, tự động ghi lúc tạo (auto_now_add)
    """
    de_tai_info = DeTaiTomTatSerializer(
        source="MaDeTai",
        read_only=True,
    )

    class Meta:
        model  = TienDo
        fields = [
            "MaTienDo", "TyLeHoanThanh", "NoiDung",
            "FileMinhChung", "NgayCapNhat",
            # ID để ghi
            "MaDeTai",
            # Object để đọc
            "de_tai_info",
        ]
        # NgayCapNhat do auto_now_add, không cho phép ghi đè
        read_only_fields = ["MaTienDo", "NgayCapNhat"]


# ═══════════════════════════════════════════════════════════════════════════════
# 8. BÁO CÁO
# ═══════════════════════════════════════════════════════════════════════════════

class BaoCaoSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho BaoCao:
    - de_tai_info: nhúng tên đề tài để Frontend biết báo cáo thuộc về đề tài nào
    """
    de_tai_info = DeTaiTomTatSerializer(
        source="MaDeTai",
        read_only=True,
    )

    class Meta:
        model  = BaoCao
        fields = [
            "MaBaoCao", "DuongDanFile",
            "TyLeDaoVan", "NgayNop",
            # ID để ghi
            "MaDeTai",
            # Object để đọc
            "de_tai_info",
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# 9. HỘI ĐỒNG
# ═══════════════════════════════════════════════════════════════════════════════

class HoiDongSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho HoiDong — không có FK nên không cần nested."""

    class Meta:
        model  = HoiDong
        fields = ["MaHoiDong", "TenHoiDong", "QuyetDinh"]


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ĐÁNH GIÁ
# ═══════════════════════════════════════════════════════════════════════════════

class DanhGiaSerializer(serializers.ModelSerializer):
    """
    Nested Serializer cho DanhGia:
    - hoi_dong_info: nhúng tên hội đồng
    - de_tai_info:   nhúng tên và trạng thái đề tài được đánh giá
    - XepLoai_display: trả về nhãn tiếng Việt thay vì mã ("XUATSAC" → "Xuất Sắc")
    """
    hoi_dong_info = HoiDongTomTatSerializer(
        source="MaHoiDong",
        read_only=True,
    )
    de_tai_info = DeTaiTomTatSerializer(
        source="MaDeTai",
        read_only=True,
    )
    XepLoai_display = serializers.CharField(
        source="get_XepLoai_display",
        read_only=True,
    )

    class Meta:
        model  = DanhGia
        fields = [
            "MaDanhGia", "DiemSo", "NhanXet",
            "XepLoai", "XepLoai_display",
            # ID để ghi
            "MaHoiDong", "MaDeTai",
            # Object để đọc
            "hoi_dong_info", "de_tai_info",
        ]
        read_only_fields = ["MaDanhGia"]


class DeTaiDangKySerializer(serializers.ModelSerializer):
    """
    Serializer dùng riêng cho luồng ĐĂNG KÝ ĐỀ TÀI của Sinh viên.

    - TrangThai bị loại khỏi input (exclude) → Frontend không thể tự ý
      gửi trạng thái khác, hệ thống sẽ tự gán "CHODUYET" trong view.
    - MaDeTai bắt buộc phải do người dùng cung cấp (không auto-generate).
    """
    class Meta:
        model  = DeTai
        fields = ["MaDeTai", "TenDeTai", "TomTat"]
        # Không có "TrangThai" → bị chặn hoàn toàn từ phía input


class TienDoTaoMoiSerializer(serializers.ModelSerializer):
    """
    Serializer dùng riêng cho luồng CẬP NHẬT TIẾN ĐỘ của Sinh viên.

    - MaDeTai: read_only vì sẽ được tự động gán từ đề tài của sinh viên
      đang đăng nhập (không cho Frontend tự chọn đề tài khác).
    - NgayCapNhat: do auto_now_add, luôn read_only.
    """
    de_tai_info = DeTaiTomTatSerializer(source="MaDeTai", read_only=True)

    class Meta:
        model  = TienDo
        fields = [
            "MaTienDo", "TyLeHoanThanh", "NoiDung",
            "FileMinhChung", "NgayCapNhat",
            "MaDeTai", "de_tai_info",
        ]
        read_only_fields = ["MaTienDo", "MaDeTai", "NgayCapNhat"]


class BaoCaoNopSerializer(serializers.ModelSerializer):
    """
    Serializer xử lý multipart/form-data khi Sinh viên upload file báo cáo.
    Không kế thừa các field MaDeTai/NgayNop vì 2 trường này được
    gán tự động trong view, không nhận từ Frontend.
    """
    class Meta:
        model  = BaoCao
        fields = ["MaBaoCao", "FileBaoCao", "TyLeDaoVan"]

    def validate_FileBaoCao(self, file):
        """
        Validate bổ sung phía serializer (model validators chỉ chạy
        khi gọi full_clean(), DRF không tự động gọi full_clean()).
        """
        ten_file = file.name.lower()
        if not ten_file.endswith((".pdf", ".doc", ".docx")):
            raise serializers.ValidationError(
                "Chỉ chấp nhận file định dạng .pdf, .doc hoặc .docx."
            )
        max_size_mb = 20
        if file.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"File không được vượt quá {max_size_mb}MB."
            )
        return file


class BaoCaoChiTietSerializer(serializers.ModelSerializer):
    """
    Serializer cho GET chi tiết báo cáo — kiểm soát ai được thấy URL file.
    URL chỉ trả về nếu serializer.context['user_co_quyen_xem_file'] = True.
    """
    de_tai_info = DeTaiTomTatSerializer(source="MaDeTai", read_only=True)
    FileBaoCao  = serializers.SerializerMethodField()

    class Meta:
        model  = BaoCao
        fields = [
            "MaBaoCao", "FileBaoCao", "TyLeDaoVan",
            "NgayNop", "MaDeTai", "de_tai_info",
        ]

    def get_FileBaoCao(self, obj):
        # ── ĐIỂM MẤU CHỐT KIỂM SOÁT QUYỀN XEM FILE ──────────────────────
        co_quyen = self.context.get("user_co_quyen_xem_file", False)
        if not co_quyen or not obj.FileBaoCao:
            return None
        request = self.context.get("request")
        url = obj.FileBaoCao.url
        # build_absolute_uri để Frontend nhận URL đầy đủ http://...
        return request.build_absolute_uri(url) if request else url


class DanhGiaChamDiemSerializer(serializers.ModelSerializer):
    """
    Serializer cho TỪNG thành viên hội đồng chấm điểm độc lập.
    ThanhVienCham được gán tự động trong view dựa trên GV đang đăng nhập,
    không nhận từ body — tránh giả mạo chấm thay người khác.
    """
    class Meta:
        model  = DanhGia
        fields = ["MaDanhGia", "DiemSo", "NhanXet", "MaHoiDong", "MaDeTai"]
        read_only_fields = ["MaDanhGia"]

    def validate_DiemSo(self, value):
        if not (0 <= value <= 10):
            raise serializers.ValidationError("Điểm số phải trong khoảng 0–10.")
        return value


class DanhGiaXemSerializer(serializers.ModelSerializer):
    """Serializer hiển thị phiếu điểm — dùng cho GET list/tổng kết."""
    thanh_vien_info = serializers.SerializerMethodField()
    XepLoai_display = serializers.CharField(source="get_XepLoai_display", read_only=True)

    class Meta:
        model  = DanhGia
        fields = [
            "MaDanhGia", "DiemSo", "NhanXet", "XepLoai", "XepLoai_display",
            "MaHoiDong", "MaDeTai", "thanh_vien_info",
        ]

    def get_thanh_vien_info(self, obj):
        if not obj.ThanhVienCham:
            return None
        gv = obj.ThanhVienCham.MaGV
        return {
            "MaGV"  : gv.MaGV,
            "TenGV" : gv.TenGV,
            "VaiTro": obj.ThanhVienCham.get_VaiTro_display(),
        }

# api/serializers.py — THÊM VÀO CUỐI FILE

class DeTaiChiTietSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho DeTai kèm thông tin Hội đồng và điểm tổng hợp."""
    TrangThai_display = serializers.CharField(
        source="get_TrangThai_display", read_only=True
    )
    hoi_dong_info = HoiDongTomTatSerializer(
        source="MaHoiDong", read_only=True
    )
    # Thống kê nhanh số lần cập nhật tiến độ
    so_tien_do = serializers.SerializerMethodField()

    class Meta:
        model  = DeTai
        fields = [
            "MaDeTai", "TenDeTai", "TomTat",
            "TrangThai", "TrangThai_display",
            "MaHoiDong", "hoi_dong_info",
            "DiemTongHop", "LyDoTuChoi", "so_tien_do",
        ]

    def get_so_tien_do(self, obj):
        return obj.tien_dos.count()


class TienDoVoiNhanXetSerializer(serializers.ModelSerializer):
    """Trả về tiến độ kèm nhận xét GVHD — dùng cho SV xem phản hồi."""
    de_tai_info = DeTaiTomTatSerializer(source="MaDeTai", read_only=True)

    class Meta:
        model  = TienDo
        fields = [
            "MaTienDo", "TyLeHoanThanh", "NoiDung",
            "FileMinhChung", "NgayCapNhat",
            "NhanXetGVHD", "NgayNhanXet",   # ← Phản hồi từ GVHD
            "MaDeTai", "de_tai_info",
        ]
        read_only_fields = [
            "MaTienDo", "NgayCapNhat",
            "NhanXetGVHD", "NgayNhanXet",   # SV không được tự sửa nhận xét
        ]


class NhanXetGVHDSerializer(serializers.Serializer):
    """Serializer riêng cho GVHD gửi nhận xét vào bản ghi TienDo."""
    NhanXetGVHD = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=2000,
        error_messages={"required": "Nội dung nhận xét không được để trống."}
    )


class HuongDanSerializer(serializers.ModelSerializer):
    """Cập nhật để hiển thị trạng thái xác nhận."""
    giang_vien_info = GiangVienTomTatSerializer(source="MaGV", read_only=True)
    de_tai_info     = DeTaiTomTatSerializer(source="MaDeTai", read_only=True)

    class Meta:
        model  = HuongDan
        fields = [
            "MaHuongDan", "VaiTro", "DaXacNhan", "NgayXacNhan",
            "MaDeTai", "MaGV",
            "de_tai_info", "giang_vien_info",
        ]
        read_only_fields = ["MaHuongDan", "DaXacNhan", "NgayXacNhan"]


class PhanCongHoiDongSerializer(serializers.Serializer):
    """Serializer cho action phân công Hội đồng vào Đề tài."""
    MaHoiDong = serializers.CharField(
        required=True,
        error_messages={"required": "Mã Hội đồng là bắt buộc."}
    )

    def validate_MaHoiDong(self, value):
        from .models import HoiDong
        if not HoiDong.objects.filter(pk=value).exists():
            raise serializers.ValidationError(
                f"Không tìm thấy Hội đồng với mã '{value}'."
            )
        return value


class TuChoiDeTaiSerializer(serializers.Serializer):
    """Serializer cho action từ chối đề tài — bắt buộc có lý do."""
    LyDoTuChoi = serializers.CharField(
        required=True,
        allow_blank=False,
        min_length=10,
        error_messages={
            "required"  : "Phải cung cấp lý do từ chối.",
            "min_length": "Lý do từ chối phải có ít nhất 10 ký tự.",
        }
    )


class KetQuaDanhGiaSerializer(serializers.ModelSerializer):
    """Serializer tổng hợp kết quả đánh giá cho SV xem."""
    hoi_dong_info = HoiDongTomTatSerializer(source="MaHoiDong", read_only=True)
    XepLoai_display = serializers.CharField(
        source="get_XepLoai_display", read_only=True
    )

    class Meta:
        model  = DanhGia
        fields = [
            "MaDanhGia", "DiemSo", "NhanXet",
            "XepLoai", "XepLoai_display",
            "MaHoiDong", "hoi_dong_info",
        ]

# api/serializers.py — THÊM VÀO CUỐI FILE
from .models import BaiBaoNCKH

class BaiBaoNCKHListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách (List) — dùng ở trang chủ.
    Không trả về NoiDungChiTiet để giảm kích thước response.
    """
    GiaiThuong_display = serializers.CharField(
        source="get_GiaiThuong_display",
        read_only=True,
    )

    class Meta:
        model  = BaiBaoNCKH
        fields = [
            "id",
            "TenDeTai",
            "TacGia",
            "NamHoanThanh",
            "GiaiThuong",
            "GiaiThuong_display",
            "AnhBia",
            "TomTat",
        ]


class BaiBaoNCKHDetailSerializer(serializers.ModelSerializer):
    """
    Serializer cho chi tiết (Retrieve) — trả về khi bấm "Xem chi tiết".
    Bao gồm đầy đủ NoiDungChiTiet (HTML).
    """
    GiaiThuong_display = serializers.CharField(
        source="get_GiaiThuong_display",
        read_only=True,
    )

    class Meta:
        model  = BaiBaoNCKH
        fields = [
            "id",
            "TenDeTai",
            "TacGia",
            "NamHoanThanh",
            "GiaiThuong",
            "GiaiThuong_display",
            "AnhBia",
            "TomTat",
            "NoiDungChiTiet",   # ← Chỉ có ở detail
            "NgayCapNhat",
        ]

class ThanhVienHoiDongSerializer(serializers.ModelSerializer):
    giang_vien_info = GiangVienTomTatSerializer(source="MaGV", read_only=True)

    class Meta:
        model  = ThanhVienHoiDong
        fields = ["MaThanhVien", "MaHoiDong", "MaGV", "VaiTro", "giang_vien_info"]


class PhanCongThanhVienSerializer(serializers.Serializer):
    """
    Serializer dùng khi Cán bộ phân công 1 Giảng viên vào Hội đồng.
    Đây là nơi RÀNG BUỘC CONFLICT OF INTEREST được kiểm tra.
    """
    MaGV   = serializers.CharField(required=True)
    VaiTro = serializers.ChoiceField(choices=ThanhVienHoiDong.VaiTroHD.choices)

    def validate_MaGV(self, value):
        if not GiangVien.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Không tìm thấy Giảng viên '{value}'.")
        return value