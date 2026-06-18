# api/management/commands/seed_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models  import User
from django.contrib.auth.hashers import make_password
from django.utils                import timezone

from faker import Faker
import random
from datetime import timedelta

from api.models import (
    TaiKhoan, SinhVien, GiangVien, CanBoQuanLy,
    DeTai, HuongDan, TienDo, BaoCao, HoiDong, DanhGia,
)

fake = Faker("vi_VN")   # Dùng locale tiếng Việt cho tên người, địa chỉ


# ══════════════════════════════════════════════════════════════════════════════
# Hằng số dùng chung
# ══════════════════════════════════════════════════════════════════════════════
MAT_KHAU_CHUNG = "Admin@123"

KHOA_LIST = [
    "Công nghệ thông tin",
    "An toàn thông tin",
    "Kỹ thuật mật mã",
    "Toán học ứng dụng",
]

LOP_LIST = ["L01", "L02", "L03", "L04", "AT01", "AT02", "KM01"]

HOC_HAM_LIST = [
    "GS.TS.", "PGS.TS.", "TS.", "ThS.", "PGS.TS.",
]

PHONG_BAN_LIST = [
    "Phòng Khoa học & Công nghệ",
    "Phòng Đào tạo",
    "Phòng Nghiên cứu & Phát triển",
    "Ban Giám hiệu",
    "Phòng Quản lý Sinh viên",
]

# Tên đề tài mẫu để dữ liệu có nghĩa hơn dữ liệu random thuần túy
DE_TAI_TEMPLATES = [
    {
        "ten"   : "Ứng dụng học máy trong phát hiện tấn công mạng DDoS",
        "tomtat": (
            "Nghiên cứu và xây dựng hệ thống phát hiện tấn công DDoS "
            "sử dụng các thuật toán học máy như Random Forest và LSTM. "
            "Đánh giá hiệu quả trên bộ dữ liệu CICIDS2017."
        ),
    },
    {
        "ten"   : "Hệ thống nhận dạng khuôn mặt sử dụng mạng neural tích chập",
        "tomtat": (
            "Triển khai mô hình FaceNet kết hợp với thuật toán MTCNN để "
            "phát hiện và nhận dạng khuôn mặt trong môi trường thực tế. "
            "Độ chính xác mục tiêu đạt trên 95% trên tập LFW."
        ),
    },
    {
        "ten"   : "Phân tích cảm xúc văn bản tiếng Việt với mô hình PhoBERT",
        "tomtat": (
            "Ứng dụng mô hình ngôn ngữ lớn PhoBERT cho bài toán phân tích "
            "cảm xúc bình luận tiếng Việt trên mạng xã hội. "
            "Xây dựng tập dữ liệu annotated gồm 50.000 mẫu."
        ),
    },
    {
        "ten"   : "Xây dựng hệ thống quản lý thư viện số sử dụng Blockchain",
        "tomtat": (
            "Thiết kế và triển khai hệ thống quản lý bản quyền tài liệu số "
            "dựa trên nền tảng Ethereum smart contract. "
            "Đảm bảo tính minh bạch và không thể giả mạo của metadata tài liệu."
        ),
    },
    {
        "ten"   : "Mã hóa đồng cấu ứng dụng trong tính toán bảo mật đám mây",
        "tomtat": (
            "Nghiên cứu lý thuyết và triển khai thực nghiệm thuật toán BFV "
            "cho phép tính toán trực tiếp trên dữ liệu mã hóa. "
            "So sánh hiệu năng với CKKS và TFHE."
        ),
    },
    {
        "ten"   : "Hệ thống phát hiện phần mềm độc hại sử dụng phân tích hành vi",
        "tomtat": (
            "Xây dựng sandbox phân tích động phần mềm độc hại, "
            "trích xuất đặc trưng hành vi API call và network traffic, "
            "phân loại bằng XGBoost với F1-score đạt 0.93."
        ),
    },
    {
        "ten"   : "Tối ưu hóa giao thức TLS 1.3 cho thiết bị IoT có tài nguyên hạn chế",
        "tomtat": (
            "Nghiên cứu và cài đặt biến thể TLS 1.3 tối ưu cho vi điều khiển ARM "
            "Cortex-M4. Giảm overhead bộ nhớ xuống dưới 32KB RAM "
            "trong khi vẫn đảm bảo tính bảo mật."
        ),
    },
    {
        "ten"   : "Ứng dụng xử lý ngôn ngữ tự nhiên hỗ trợ tra cứu văn bản pháp luật",
        "tomtat": (
            "Xây dựng hệ thống tìm kiếm ngữ nghĩa các văn bản pháp luật Việt Nam "
            "sử dụng mô hình Sentence-BERT kết hợp Elasticsearch. "
            "Hỗ trợ tìm kiếm theo ngữ nghĩa với độ trễ dưới 200ms."
        ),
    },
    {
        "ten"   : "Nghiên cứu giao thức đồng thuận Proof of Authority cho mạng riêng",
        "tomtat": (
            "Phân tích, so sánh và triển khai thử nghiệm mạng blockchain riêng "
            "sử dụng PoA consensus. Đánh giá throughput, latency và "
            "khả năng chịu lỗi Byzantine trong môi trường doanh nghiệp."
        ),
    },
    {
        "ten"   : "Hệ thống giám sát an ninh mạng thời gian thực với SIEM tự xây dựng",
        "tomtat": (
            "Thiết kế kiến trúc và cài đặt hệ thống SIEM thu thập log từ "
            "nhiều nguồn (firewall, IDS, web server), phân tích tương quan sự kiện "
            "và cảnh báo tự động qua Telegram/Email."
        ),
    },
]


class Command(BaseCommand):
    help = (
        "Xóa sạch dữ liệu cũ và tạo bộ dữ liệu mẫu đầy đủ "
        "cho hệ thống quản lý NCKH sinh viên."
    )

    # ── Tham số tùy chọn khi chạy lệnh ───────────────────────────────────────
    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-teardown",
            action="store_true",
            help="Bỏ qua bước xóa dữ liệu cũ, chỉ tạo mới.",
        )

    # ══════════════════════════════════════════════════════════════════════════
    # ENTRY POINT
    # ══════════════════════════════════════════════════════════════════════════
    def handle(self, *args, **options):
        self.stdout.write("\n" + "═" * 60)
        self.stdout.write(self.style.SUCCESS("  SEED DATA — Hệ thống NCKH Sinh viên"))
        self.stdout.write("═" * 60)

        if not options["skip_teardown"]:
            self._teardown()

        # Chạy từng bước tạo dữ liệu theo thứ tự phụ thuộc
        can_bos    = self._seed_can_bo(so_luong=5)
        giang_viens = self._seed_giang_vien(so_luong=10)
        sinh_viens  = self._seed_sinh_vien(so_luong=20)
        hoi_dongs   = self._seed_hoi_dong(so_luong=3)

        self._seed_de_tai_va_lien_ket(
            sinh_viens, giang_viens, hoi_dongs
        )

        self.stdout.write("\n" + "═" * 60)
        self.stdout.write(self.style.SUCCESS("✅ HOÀN TẤT! Tóm tắt dữ liệu đã tạo:"))
        self._in_tom_tat()
        self.stdout.write("═" * 60 + "\n")

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 0 — XÓA DỮ LIỆU CŨ
    # Thứ tự xóa: bảng con trước, bảng cha sau (tránh lỗi FK constraint)
    # ══════════════════════════════════════════════════════════════════════════
    def _teardown(self):
        self.stdout.write("\n🗑️  Đang xóa dữ liệu cũ...")

        # Thứ tự: bảng phụ thuộc nhiều nhất → ít nhất
        buoc_xoa = [
            (DanhGia,     "DanhGia"),
            (BaoCao,      "BaoCao"),
            (TienDo,      "TienDo"),
            (HuongDan,    "HuongDan"),
            (HoiDong,     "HoiDong"),
            (DeTai,       "DeTai"),
            (SinhVien,    "SinhVien"),
            (GiangVien,   "GiangVien"),
            (CanBoQuanLy, "CanBoQuanLy"),
            (TaiKhoan,    "TaiKhoan"),
        ]

        for model, ten in buoc_xoa:
            so_luong = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f"   ✓ Xóa {so_luong:>3} bản ghi {ten}")

        # Xóa Django User (trừ superuser để không mất quyền admin)
        so_user = User.objects.filter(is_superuser=False).count()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(f"   ✓ Xóa {so_user:>3} bản ghi Django User")
        self.stdout.write(self.style.WARNING("   → Giữ lại superuser hiện có\n"))

    # ══════════════════════════════════════════════════════════════════════════
    # HELPER — Tạo cặp Django User + TaiKhoan
    # ══════════════════════════════════════════════════════════════════════════
    def _tao_tai_khoan(self, username: str, quyen_han: str, is_staff: bool = False) -> TaiKhoan:
        """Tạo Django User và TaiKhoan nghiệp vụ tương ứng."""
        mat_khau_hash = make_password(MAT_KHAU_CHUNG)

        User.objects.create(
            username=username,
            password=mat_khau_hash,
            is_staff=is_staff,
        )
        return TaiKhoan.objects.create(
            TenDangNhap=username,
            MatKhauHash=mat_khau_hash,
            QuyenHan=quyen_han,
            TrangThai=1,
        )

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 1 — CÁN BỘ QUẢN LÝ
    # ══════════════════════════════════════════════════════════════════════════
    def _seed_can_bo(self, so_luong: int) -> list:
        self.stdout.write(f"👔 Tạo {so_luong} Cán bộ quản lý...")
        danh_sach = []

        for i in range(1, so_luong + 1):
            username = f"canbo{i:02d}"
            tai_khoan = self._tao_tai_khoan(
                username, TaiKhoan.QuyenHanChoices.QUAN_LY, is_staff=True
            )
            ho_ten = fake.name()
            cb = CanBoQuanLy.objects.create(
                MaCB        = f"CB{i:03d}",
                TenDangNhap = tai_khoan,
                TenCB       = ho_ten,
                PhongBan    = PHONG_BAN_LIST[i % len(PHONG_BAN_LIST)],
            )
            danh_sach.append(cb)
            self.stdout.write(f"   ✓ {username} — {ho_ten}")

        return danh_sach

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 2 — GIẢNG VIÊN
    # ══════════════════════════════════════════════════════════════════════════
    def _seed_giang_vien(self, so_luong: int) -> list:
        self.stdout.write(f"\n👨‍🏫 Tạo {so_luong} Giảng viên...")
        danh_sach = []

        for i in range(1, so_luong + 1):
            username  = f"giangvien{i:02d}"
            tai_khoan = self._tao_tai_khoan(
                username, TaiKhoan.QuyenHanChoices.GIANG_VIEN
            )
            hoc_ham  = HOC_HAM_LIST[i % len(HOC_HAM_LIST)]
            ten_gv   = fake.name()
            gv = GiangVien.objects.create(
                MaGV        = f"GV{i:03d}",
                TenDangNhap = tai_khoan,
                TenGV       = ten_gv,
                HocHamHocVi = hoc_ham,
            )
            danh_sach.append(gv)
            self.stdout.write(f"   ✓ {username} — {hoc_ham} {ten_gv}")

        return danh_sach

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 3 — SINH VIÊN
    # ══════════════════════════════════════════════════════════════════════════
    def _seed_sinh_vien(self, so_luong: int) -> list:
        self.stdout.write(f"\n🎓 Tạo {so_luong} Sinh viên...")
        danh_sach = []

        for i in range(1, so_luong + 1):
            username  = f"sinhvien{i:02d}"
            tai_khoan = self._tao_tai_khoan(
                username, TaiKhoan.QuyenHanChoices.SINH_VIEN
            )
            ten_sv = fake.name()
            ma_sv  = f"CT{random.randint(80000, 89999)}"
            sv = SinhVien.objects.create(
                MaSV        = ma_sv,
                TenDangNhap = tai_khoan,
                TenSV       = ten_sv,
                Lop         = LOP_LIST[i % len(LOP_LIST)],
                Khoa        = KHOA_LIST[i % len(KHOA_LIST)],
                MaDeTai     = None,   # Sẽ gán sau khi tạo đề tài
            )
            danh_sach.append(sv)
            self.stdout.write(f"   ✓ {username} — {ten_sv} ({ma_sv})")

        return danh_sach

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 4 — HỘI ĐỒNG
    # ══════════════════════════════════════════════════════════════════════════
    def _seed_hoi_dong(self, so_luong: int) -> list:
        self.stdout.write(f"\n🏛️  Tạo {so_luong} Hội đồng đánh giá...")
        danh_sach = []
        nam = timezone.now().year

        for i in range(1, so_luong + 1):
            hd = HoiDong.objects.create(
                MaHoiDong  = f"HD{i:03d}",
                TenHoiDong = f"Hội đồng NCKH Đợt {i} Năm {nam} — Khoa CNTT",
                QuyetDinh  = f"QD-{nam}-HĐNCKH-{i:03d}",
            )
            danh_sach.append(hd)
            self.stdout.write(f"   ✓ {hd.MaHoiDong} — {hd.TenHoiDong}")

        return danh_sach

    # ══════════════════════════════════════════════════════════════════════════
    # BƯỚC 5 — ĐỀ TÀI VÀ LIÊN KẾT (phần quan trọng nhất)
    # Tạo 10 đề tài trải rộng ở các trạng thái khác nhau để cover mọi luồng
    # ══════════════════════════════════════════════════════════════════════════
    def _seed_de_tai_va_lien_ket(
        self,
        sinh_viens : list,
        giang_viens: list,
        hoi_dongs  : list,
    ):
        self.stdout.write("\n📋 Tạo Đề tài và liên kết nghiệp vụ...")

        # Lấy SV chưa có đề tài từ pool (xáo trộn để random)
        pool_sv = sinh_viens.copy()
        random.shuffle(pool_sv)
        sv_index = 0  # Con trỏ vào pool SV

        def lay_sv(so_luong=1):
            """Lấy SV từ pool, đảm bảo không dùng lại."""
            nonlocal sv_index
            ket_qua = pool_sv[sv_index : sv_index + so_luong]
            sv_index += so_luong
            return ket_qua

        now = timezone.now()

        # ── NHÓM 1: CHODUYET (2 đề tài) ─────────────────────────────────────
        self.stdout.write("\n   📌 Nhóm 1 — Chờ Duyệt (2 đề tài)")
        for idx in [0, 1]:
            tmpl  = DE_TAI_TEMPLATES[idx]
            ma_dt = f"DT2024{idx + 1:03d}"
            sv_nhom = lay_sv(1)

            de_tai = DeTai.objects.create(
                MaDeTai   = ma_dt,
                TenDeTai  = tmpl["ten"],
                TomTat    = tmpl["tomtat"],
                TrangThai = DeTai.TrangThaiDeTai.CHO_DUYET,
            )
            # Gán đề tài cho sinh viên
            for sv in sv_nhom:
                sv.MaDeTai = de_tai
                sv.save(update_fields=["MaDeTai"])

            self.stdout.write(
                f"      ✓ [{ma_dt}] {tmpl['ten'][:50]}... "
                f"→ SV: {sv_nhom[0].TenDangNhap_id}"
            )

        # ── NHÓM 2: DANGTHUCHIEN (3 đề tài) ─────────────────────────────────
        self.stdout.write("\n   📌 Nhóm 2 — Đang Thực Hiện (3 đề tài)")
        for idx in [2, 3, 4]:
            tmpl   = DE_TAI_TEMPLATES[idx]
            ma_dt  = f"DT2024{idx + 1:03d}"
            sv_nhom = lay_sv(2)   # Mỗi đề tài có 2 sinh viên
            gv_giang = giang_viens[(idx - 2) % len(giang_viens)]

            de_tai = DeTai.objects.create(
                MaDeTai   = ma_dt,
                TenDeTai  = tmpl["ten"],
                TomTat    = tmpl["tomtat"],
                TrangThai = DeTai.TrangThaiDeTai.DANG_THUC_HIEN,
            )
            for sv in sv_nhom:
                sv.MaDeTai = de_tai
                sv.save(update_fields=["MaDeTai"])

            # Phân công giảng viên hướng dẫn (đã xác nhận)
            HuongDan.objects.create(
                MaDeTai    = de_tai,
                MaGV       = gv_giang,
                VaiTro     = "Chủ nhiệm",
                DaXacNhan  = True,
                NgayXacNhan = now - timedelta(days=random.randint(20, 40)),
            )

            # Tạo 3 bản ghi tiến độ trải dài theo thời gian
            ty_le_tien_do = [20, 45, 70]
            noi_dung_td   = [
                "Hoàn thành tổng quan tài liệu và xác định bài toán nghiên cứu.",
                "Thiết kế kiến trúc hệ thống, thu thập và tiền xử lý dữ liệu.",
                "Cài đặt mô hình baseline, đạt kết quả sơ bộ trên tập validation.",
            ]
            nhan_xet_gvhd = [
                "Tổng quan tốt, bao quát đủ các công trình liên quan. "
                "Cần bổ sung thêm so sánh với các phương pháp state-of-the-art.",
                "Kiến trúc hợp lý. Lưu ý cân bằng dữ liệu (class imbalance) "
                "trước khi huấn luyện.",
                "",   # Bản ghi cuối chưa có nhận xét
            ]
            for j, (ty_le, nd, nx) in enumerate(
                zip(ty_le_tien_do, noi_dung_td, nhan_xet_gvhd)
            ):
                TienDo.objects.create(
                    MaDeTai       = de_tai,
                    TyLeHoanThanh = ty_le,
                    NoiDung       = nd,
                    FileMinhChung = f"{ma_dt}_tuan{(j+1)*3}.pdf",
                    NgayCapNhat   = now - timedelta(days=(3 - j) * 14),
                    NhanXetGVHD   = nx,
                    NgayNhanXet   = (now - timedelta(days=(3 - j) * 14 - 2)) if nx else None,
                )

            self.stdout.write(
                f"      ✓ [{ma_dt}] {tmpl['ten'][:45]}... "
                f"→ GVHD: {gv_giang.TenDangNhap_id} | "
                f"SV: {', '.join(sv.TenDangNhap_id for sv in sv_nhom)}"
            )

        # ── NHÓM 3: CHONGHIEMTHU (2 đề tài) ─────────────────────────────────
        self.stdout.write("\n   📌 Nhóm 3 — Chờ Nghiệm Thu (2 đề tài)")
        for idx in [5, 6]:
            tmpl    = DE_TAI_TEMPLATES[idx]
            ma_dt   = f"DT2024{idx + 1:03d}"
            sv_nhom = lay_sv(2)
            gv_giang = giang_viens[(idx - 5 + 3) % len(giang_viens)]

            de_tai = DeTai.objects.create(
                MaDeTai   = ma_dt,
                TenDeTai  = tmpl["ten"],
                TomTat    = tmpl["tomtat"],
                TrangThai = DeTai.TrangThaiDeTai.CHO_NGHIEM_THU,
            )
            for sv in sv_nhom:
                sv.MaDeTai = de_tai
                sv.save(update_fields=["MaDeTai"])

            HuongDan.objects.create(
                MaDeTai    = de_tai,
                MaGV       = gv_giang,
                VaiTro     = "Chủ nhiệm",
                DaXacNhan  = True,
                NgayXacNhan = now - timedelta(days=60),
            )

            # Tiến độ đầy đủ (100%)
            for j, (ty_le, nd) in enumerate([
                (30, "Hoàn thành phân tích yêu cầu và thiết kế hệ thống chi tiết."),
                (60, "Cài đặt và kiểm thử các module chức năng chính."),
                (100, "Hoàn thiện hệ thống, viết tài liệu và chuẩn bị báo cáo tổng kết."),
            ]):
                TienDo.objects.create(
                    MaDeTai       = de_tai,
                    TyLeHoanThanh = ty_le,
                    NoiDung       = nd,
                    FileMinhChung = f"{ma_dt}_tuan{(j+1)*4}.pdf",
                    NgayCapNhat   = now - timedelta(days=(3 - j) * 10),
                    NhanXetGVHD   = "Tiến độ đúng kế hoạch. Chuẩn bị tốt cho báo cáo nghiệm thu.",
                    NgayNhanXet   = now - timedelta(days=(3 - j) * 10 - 1),
                )

            # Báo cáo tổng kết đã nộp
            BaoCao.objects.create(
                MaBaoCao    = f"BC2024{idx + 1:03d}",
                MaDeTai     = de_tai,
                DuongDanFile = f"baocao_tongket_{ma_dt}.pdf",
                TyLeDaoVan  = round(random.uniform(5.0, 18.0), 1),
                NgayNop     = now - timedelta(days=random.randint(3, 10)),
            )

            self.stdout.write(
                f"      ✓ [{ma_dt}] {tmpl['ten'][:45]}... "
                f"→ Đã nộp BaoCao, chờ HĐ"
            )

        # ── NHÓM 4: DANGHIEMTHU (3 đề tài) ──────────────────────────────────
        self.stdout.write("\n   📌 Nhóm 4 — Đã Nghiệm Thu (3 đề tài)")
        diem_mau = [8.5, 9.0, 7.5]   # Điểm của 3 đề tài đã nghiệm thu

        for i, idx in enumerate([7, 8, 9]):
            tmpl    = DE_TAI_TEMPLATES[idx]
            ma_dt   = f"DT2024{idx + 1:03d}"
            sv_nhom = lay_sv(2)
            gv_giang = giang_viens[(idx - 7 + 6) % len(giang_viens)]
            hoi_dong = hoi_dongs[i % len(hoi_dongs)]
            diem     = diem_mau[i]
            xep_loai = self._tinh_xep_loai(diem)

            de_tai = DeTai.objects.create(
                MaDeTai    = ma_dt,
                TenDeTai   = tmpl["ten"],
                TomTat     = tmpl["tomtat"],
                TrangThai  = DeTai.TrangThaiDeTai.DA_NGHIEM_THU,
                MaHoiDong  = hoi_dong,
                DiemTongHop = diem,
            )
            for sv in sv_nhom:
                sv.MaDeTai = de_tai
                sv.save(update_fields=["MaDeTai"])

            HuongDan.objects.create(
                MaDeTai    = de_tai,
                MaGV       = gv_giang,
                VaiTro     = "Chủ nhiệm",
                DaXacNhan  = True,
                NgayXacNhan = now - timedelta(days=90),
            )

            # Tiến độ đầy đủ
            for j, (ty_le, nd) in enumerate([
                (25, "Khảo sát tài liệu và xây dựng đề cương nghiên cứu."),
                (55, "Triển khai prototype và thực nghiệm bước đầu."),
                (100, "Hoàn thiện, tối ưu và viết báo cáo tổng kết."),
            ]):
                TienDo.objects.create(
                    MaDeTai       = de_tai,
                    TyLeHoanThanh = ty_le,
                    NoiDung       = nd,
                    FileMinhChung = f"{ma_dt}_phase{j+1}.pdf",
                    NgayCapNhat   = now - timedelta(days=90 - j * 25),
                    NhanXetGVHD   = "Hoàn thành đúng tiến độ, chất lượng tốt.",
                    NgayNhanXet   = now - timedelta(days=89 - j * 25),
                )

            # Báo cáo tổng kết
            BaoCao.objects.create(
                MaBaoCao    = f"BC2024{idx + 1:03d}",
                MaDeTai     = de_tai,
                DuongDanFile = f"baocao_tongket_{ma_dt}_final.pdf",
                TyLeDaoVan  = round(random.uniform(3.0, 12.0), 1),
                NgayNop     = now - timedelta(days=35),
            )

            # Phiếu đánh giá từ hội đồng
            nhan_xet_hd = [
                "Đề tài có đóng góp khoa học rõ ràng, kết quả thực nghiệm thuyết phục. "
                "Báo cáo trình bày mạch lạc, hình thức đẹp.",
                "Ý tưởng sáng tạo, độ khó cao. Cần cải thiện phần tổng quan "
                "và bổ sung thêm so sánh với baseline.",
                "Đề tài thực tiễn, có khả năng ứng dụng cao. Kết quả đạt yêu cầu, "
                "phần đánh giá bảo mật cần chi tiết hơn.",
            ]
            DanhGia.objects.create(
                MaHoiDong = hoi_dong,
                MaDeTai   = de_tai,
                DiemSo    = diem,
                NhanXet   = nhan_xet_hd[i],
                XepLoai   = xep_loai,
            )

            self.stdout.write(
                f"      ✓ [{ma_dt}] {tmpl['ten'][:40]}... "
                f"→ HĐ: {hoi_dong.MaHoiDong} | "
                f"Điểm: {diem} ({self._ten_xep_loai(xep_loai)})"
            )

    # ══════════════════════════════════════════════════════════════════════════
    # HELPER — Tính XepLoai từ điểm
    # ══════════════════════════════════════════════════════════════════════════
    @staticmethod
    def _tinh_xep_loai(diem: float) -> str:
        if diem >= 9.0:   return DanhGia.XepLoaiChoices.XUAT_SAC
        elif diem >= 8.0: return DanhGia.XepLoaiChoices.GIOI
        elif diem >= 6.5: return DanhGia.XepLoaiChoices.KHA
        elif diem >= 5.0: return DanhGia.XepLoaiChoices.TRUNG_BINH
        else:             return DanhGia.XepLoaiChoices.KHONG_DAT

    @staticmethod
    def _ten_xep_loai(ma: str) -> str:
        bang = {
            "XUATSAC"  : "Xuất Sắc",
            "GIOI"     : "Giỏi",
            "KHA"      : "Khá",
            "TRUNGBINH": "Trung Bình",
            "KHONGDAT" : "Không Đạt",
        }
        return bang.get(ma, ma)

    # ══════════════════════════════════════════════════════════════════════════
    # IN TÓM TẮT SAU KHI HOÀN TẤT
    # ══════════════════════════════════════════════════════════════════════════
    def _in_tom_tat(self):
        bang = [
            ("TaiKhoan",    TaiKhoan.objects.count()),
            ("CanBoQuanLy", CanBoQuanLy.objects.count()),
            ("GiangVien",   GiangVien.objects.count()),
            ("SinhVien",    SinhVien.objects.count()),
            ("DeTai",       DeTai.objects.count()),
            ("HuongDan",    HuongDan.objects.count()),
            ("TienDo",      TienDo.objects.count()),
            ("BaoCao",      BaoCao.objects.count()),
            ("HoiDong",     HoiDong.objects.count()),
            ("DanhGia",     DanhGia.objects.count()),
        ]
        for ten, so_luong in bang:
            self.stdout.write(f"   {ten:<16}: {so_luong:>3} bản ghi")

        self.stdout.write(
            f"\n   Mật khẩu chung : {MAT_KHAU_CHUNG}"
            f"\n   Sinh viên test : sinhvien01 / {MAT_KHAU_CHUNG}"
            f"\n   Giảng viên test: giangvien01 / {MAT_KHAU_CHUNG}"
            f"\n   Cán bộ test    : canbo01 / {MAT_KHAU_CHUNG}"
        )