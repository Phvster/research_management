# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TaiKhoanViewSet, DeTaiViewSet, SinhVienViewSet,
    GiangVienViewSet, CanBoQuanLyViewSet, HuongDanViewSet,
    TienDoViewSet, BaoCaoViewSet, HoiDongViewSet, DanhGiaViewSet,
    BaiBaoNCKHViewSet,
)

from .views import lay_thong_tin_ca_nhan
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# ─── Khởi tạo Router ──────────────────────────────────────────────────────────
# DefaultRouter tự động sinh ra toàn bộ URL patterns cho 5 action CRUD:
#   GET    /api/<prefix>/           → list
#   POST   /api/<prefix>/           → create
#   GET    /api/<prefix>/{pk}/      → retrieve
#   PUT    /api/<prefix>/{pk}/      → update
#   PATCH  /api/<prefix>/{pk}/      → partial_update
#   DELETE /api/<prefix>/{pk}/      → destroy
# Ngoài ra còn sinh ra /api/ root endpoint liệt kê tất cả URL (tiện debug).
router = DefaultRouter()

# ─── Đăng ký các ViewSet ──────────────────────────────────────────────────────
# Cú pháp: router.register(r"<url-prefix>", <ViewSet>, basename="<tên>")
# - url-prefix : đoạn URL sau /api/  (dùng kebab-case cho chuẩn RESTful)
# - basename   : tiền tố cho các URL name (vd: "tai-khoan-list", "tai-khoan-detail")

router.register(r"tai-khoan",       TaiKhoanViewSet,     basename="tai-khoan")
router.register(r"de-tai",          DeTaiViewSet,        basename="de-tai")
router.register(r"sinh-vien",       SinhVienViewSet,     basename="sinh-vien")
router.register(r"giang-vien",      GiangVienViewSet,    basename="giang-vien")
router.register(r"can-bo-quan-ly",  CanBoQuanLyViewSet,  basename="can-bo-quan-ly")
router.register(r"huong-dan",       HuongDanViewSet,     basename="huong-dan")
router.register(r"tien-do",         TienDoViewSet,       basename="tien-do")
router.register(r"bao-cao",         BaoCaoViewSet,       basename="bao-cao")
router.register(r"hoi-dong",        HoiDongViewSet,      basename="hoi-dong")
router.register(r"danh-gia",        DanhGiaViewSet,      basename="danh-gia")
router.register(r"bai-bao",        BaiBaoNCKHViewSet,   basename="bai-bao")

# ─── Export urlpatterns ────────────────────────────────────────────────────────
app_name = "api"

urlpatterns = [
    path("", include(router.urls)),
    path("me/", lay_thong_tin_ca_nhan, name="me"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

