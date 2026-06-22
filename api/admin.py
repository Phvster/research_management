# api/admin.py

from django.contrib import admin
from .models import (
    TaiKhoan, DeTai, SinhVien, GiangVien,
    CanBoQuanLy, HuongDan, TienDo,
    BaoCao, HoiDong, DanhGia, BaiBaoNCKH,
    ThanhVienHoiDong, TaiLieu
)

class HuongDanInline(admin.TabularInline):
    model = HuongDan
    extra = 1  # Hiển thị sẵn 1 dòng trống để điền
    autocomplete_fields = ["MaGV"]  # Hỗ trợ tìm kiếm GV nếu danh sách quá dài

@admin.register(TaiKhoan)
class TaiKhoanAdmin(admin.ModelAdmin):
    list_display  = ("TenDangNhap", "QuyenHan", "TrangThai")
    list_filter   = ("QuyenHan", "TrangThai")
    search_fields = ("TenDangNhap",)

@admin.register(DeTai)
class DeTaiAdmin(admin.ModelAdmin):
    list_display  = ("MaDeTai", "TenDeTai", "TrangThai")
    list_filter   = ("TrangThai",)
    search_fields = ("MaDeTai", "TenDeTai")
    inlines = [HuongDanInline]

@admin.register(SinhVien)
class SinhVienAdmin(admin.ModelAdmin):
    list_display  = ("MaSV", "TenSV", "Lop", "Khoa", "MaDeTai", "SoDienThoai", "Email")
    search_fields = ("MaSV", "TenSV")
    list_filter   = ("Khoa", "Lop")

@admin.register(GiangVien)
class GiangVienAdmin(admin.ModelAdmin):
    list_display  = ("MaGV", "TenGV", "HocHamHocVi", "SoDienThoai", "Email")
    search_fields = ("MaGV", "TenGV")

@admin.register(CanBoQuanLy)
class CanBoQuanLyAdmin(admin.ModelAdmin):
    list_display  = ("MaCB", "TenCB", "PhongBan", "SoDienThoai", "Email")
    search_fields = ("MaCB", "TenCB")

@admin.register(HuongDan)
class HuongDanAdmin(admin.ModelAdmin):
    list_display  = ("MaHuongDan", "MaDeTai", "MaGV", "VaiTro")
    list_filter   = ("VaiTro",)

@admin.register(TienDo)
class TienDoAdmin(admin.ModelAdmin):
    list_display  = ("MaTienDo", "MaDeTai", "TyLeHoanThanh", "NgayCapNhat")
    list_filter   = ("MaDeTai",)

@admin.register(BaoCao)
class BaoCaoAdmin(admin.ModelAdmin):
    list_display  = ("MaBaoCao", "MaDeTai", "TyLeDaoVan", "NgayNop")

class ThanhVienHoiDongInline(admin.TabularInline):
    model = ThanhVienHoiDong
    extra = 5  # Tự động hiện sẵn 5 dòng trống để điền 5 người
    autocomplete_fields = ["MaGV"] # Cho phép gõ tên tìm giảng viên cho nhanh

@admin.register(HoiDong)
class HoiDongAdmin(admin.ModelAdmin):
    list_display  = ("MaHoiDong", "TenHoiDong", "QuyetDinh")
    inlines = [ThanhVienHoiDongInline]


@admin.register(DanhGia)
class DanhGiaAdmin(admin.ModelAdmin):
    list_display  = ("MaDanhGia", "MaDeTai", "MaHoiDong", "DiemSo", "XepLoai")
    list_filter   = ("XepLoai",)

@admin.register(BaiBaoNCKH)
class BaiBaoNCKHAdmin(admin.ModelAdmin):
    list_display  = ("TenDeTai", "TacGia", "GiaiThuong", "NamHoanThanh", "IsActive")
    list_filter   = ("GiaiThuong", "NamHoanThanh", "IsActive")
    search_fields = ("TenDeTai", "TacGia")
    list_editable = ("IsActive",)   # Bật/tắt hiển thị ngay trên danh sách
    ordering      = ("-NamHoanThanh",)


@admin.register(TaiLieu)
class TaiLieuAdmin(admin.ModelAdmin):
    list_display = ("MaTaiLieu", "TenTaiLieu", "Loai", "NgayTao")
    list_filter = ("Loai",)
    search_fields = ("TenTaiLieu",)