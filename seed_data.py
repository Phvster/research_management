# seed_data.py
# Chạy bằng lệnh: python manage.py shell < seed_data.py

import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from api.models import TaiKhoan, SinhVien, GiangVien, CanBoQuanLy, DeTai

print("═" * 50)
print("BẮT ĐẦU TẠO DỮ LIỆU MẪU...")
print("═" * 50)

# ── Xóa dữ liệu cũ để chạy lại không bị lỗi duplicate ──────────────────────
TaiKhoan.objects.filter(
    TenDangNhap__in=["canbo01", "giangvien01", "sinhvien01", "sinhvien02"]
).delete()
User.objects.filter(
    username__in=["canbo01", "giangvien01", "sinhvien01", "sinhvien02"]
).delete()
print("✓ Đã xóa dữ liệu cũ (nếu có)")

MAT_KHAU_CHUNG = "Test@12345"
mat_khau_hash  = make_password(MAT_KHAU_CHUNG)

# ════════════════════════════════════════════════════════
# Tạo Django User (dùng cho JWT authentication)
# và TaiKhoan (dùng cho phân quyền nghiệp vụ)
# ════════════════════════════════════════════════════════
danh_sach_user = [
    {
        "username" : "canbo01",
        "quyen_han": TaiKhoan.QuyenHanChoices.QUAN_LY,
        "is_staff" : True,   # Cho phép vào /admin/
    },
    {
        "username" : "giangvien01",
        "quyen_han": TaiKhoan.QuyenHanChoices.GIANG_VIEN,
        "is_staff" : False,
    },
    {
        "username" : "sinhvien01",
        "quyen_han": TaiKhoan.QuyenHanChoices.SINH_VIEN,
        "is_staff" : False,
    },
    {
        "username" : "sinhvien02",
        "quyen_han": TaiKhoan.QuyenHanChoices.SINH_VIEN,
        "is_staff" : False,
    },
]

tai_khoan_objects = {}

for u in danh_sach_user:
    # Tạo Django User để SimpleJWT hoạt động
    django_user = User.objects.create(
        username=u["username"],
        password=mat_khau_hash,
        is_staff=u["is_staff"],
    )
    # Tạo TaiKhoan nghiệp vụ liên kết với username
    tai_khoan = TaiKhoan.objects.create(
        TenDangNhap=u["username"],
        MatKhauHash=mat_khau_hash,
        QuyenHan=u["quyen_han"],
        TrangThai=1,
    )
    tai_khoan_objects[u["username"]] = tai_khoan
    print(f"✓ Đã tạo TaiKhoan: {u['username']} ({u['quyen_han']})")

# ════════════════════════════════════════════════════════
# Tạo hồ sơ CanBoQuanLy
# ════════════════════════════════════════════════════════
CanBoQuanLy.objects.create(
    MaCB        = "CB001",
    TenDangNhap = tai_khoan_objects["canbo01"],
    TenCB       = "Nguyễn Văn An",
    PhongBan    = "Phòng Khoa học & Công nghệ",
)
print("✓ Đã tạo hồ sơ Cán bộ: CB001 - Nguyễn Văn An")

# ════════════════════════════════════════════════════════
# Tạo hồ sơ GiangVien
# ════════════════════════════════════════════════════════
GiangVien.objects.create(
    MaGV        = "GV001",
    TenDangNhap = tai_khoan_objects["giangvien01"],
    TenGV       = "TS. Trần Thị Bình",
    HocHamHocVi = "Tiến sĩ",
)
print("✓ Đã tạo hồ sơ Giảng viên: GV001 - TS. Trần Thị Bình")

# ════════════════════════════════════════════════════════
# Tạo hồ sơ SinhVien (chưa có đề tài)
# ════════════════════════════════════════════════════════
SinhVien.objects.create(
    MaSV        = "CT080149",
    TenDangNhap = tai_khoan_objects["sinhvien01"],
    TenSV       = "Nguyễn Trọng Minh Phúc",
    Lop         = "L04",
    Khoa        = "Công nghệ thông tin",
    MaDeTai     = None,
)
print("✓ Đã tạo hồ sơ Sinh viên: CT080149 - Nguyễn Trọng Minh Phúc")

SinhVien.objects.create(
    MaSV        = "CT080143",
    TenDangNhap = tai_khoan_objects["sinhvien02"],
    TenSV       = "Nguyễn Thị Thanh Ngân",
    Lop         = "L04",
    Khoa        = "Công nghệ thông tin",
    MaDeTai     = None,
)
print("✓ Đã tạo hồ sơ Sinh viên: CT080143 - Nguyễn Thị Thanh Ngân")

print("\n" + "═" * 50)
print("HOÀN TẤT! Tài khoản test:")
print("─" * 50)
print(f"  Cán bộ   : canbo01     / {MAT_KHAU_CHUNG}")
print(f"  Giảng viên: giangvien01 / {MAT_KHAU_CHUNG}")
print(f"  Sinh viên 1: sinhvien01 / {MAT_KHAU_CHUNG}")
print(f"  Sinh viên 2: sinhvien02 / {MAT_KHAU_CHUNG}")
print("═" * 50)