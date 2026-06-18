# core/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # ── Django Admin ──────────────────────────────────────────────────────────
    path("admin/", admin.site.urls),

    # ── API Routes (sẽ thêm dần khi xây nghiệp vụ) ───────────────────────────
    path("api/", include("api.urls")),

    # ── JWT Authentication Endpoints ──────────────────────────────────────────
    # POST /api/auth/token/        → Đăng nhập, nhận access + refresh token
    # POST /api/auth/token/refresh/ → Dùng refresh token để lấy access token mới
    # POST /api/auth/token/verify/  → Kiểm tra token có hợp lệ không
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # ── API Documentation ─────────────────────────────────────────────────────
    # /api/schema/          → File schema dạng YAML/JSON (dùng cho codegen)
    # /api/docs/            → Swagger UI (interactive, test được trực tiếp)
    # /api/docs/redoc/      → Redoc UI (đẹp hơn, dễ đọc hơn)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]