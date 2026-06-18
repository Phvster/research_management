# core/settings.py

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# ─── Load biến môi trường từ file .env ───────────────────────────────────────
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# ─── Bảo mật ─────────────────────────────────────────────────────────────────
# Đọc SECRET_KEY từ .env, tuyệt đối không hardcode vào code
SECRET_KEY = os.getenv("SECRET_KEY")

# DEBUG=True chỉ dùng cho môi trường development
# Khi lên production phải đặt thành False
DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# ─── Applications ─────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",           # Django REST Framework
    "rest_framework_simplejwt", # JWT Authentication
    "corsheaders",              # Xử lý CORS cho Next.js
    "drf_spectacular",          # Tự động sinh tài liệu Swagger/Redoc

    # Local apps
    "api",

    # Filter
    "django_filters",
]


# ─── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    # CorsMiddleware PHẢI đặt trên cùng, trước CommonMiddleware
    # để xử lý CORS header trước khi request đi vào các middleware khác
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


# ─── Database — PostgreSQL ────────────────────────────────────────────────────
# Đọc thông tin kết nối từ .env, không bao giờ commit password lên git
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "research_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "admin"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


# ─── Password Validators ──────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ─── Internationalization ─────────────────────────────────────────────────────
LANGUAGE_CODE = "vi"        # Tiếng Việt cho admin interface
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True               # Luôn dùng timezone-aware datetime


# ─── Static Files ─────────────────────────────────────────────────────────────
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ═══════════════════════════════════════════════════════════════════════════════
# CẤU HÌNH DJANGO REST FRAMEWORK
# ═══════════════════════════════════════════════════════════════════════════════
REST_FRAMEWORK = {
    # Mặc định yêu cầu JWT cho mọi endpoint
    # Từng view có thể override bằng permission_classes riêng
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    # Mặc định chỉ người đã đăng nhập mới được gọi API
    # Các endpoint public (register, login) sẽ dùng AllowAny
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    # Tự động sinh tài liệu với drf-spectacular
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",

    # Phân trang mặc định: trả về 10 item/trang
    # Giúp tránh load quá nhiều data trong 1 request
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,

    # Format response lỗi nhất quán
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),

    # Pagination mặc định toàn dự án
    "DEFAULT_PAGINATION_CLASS" : "api.pagination.ChuanPagination",
    "PAGE_SIZE"                : 10,

    # Filter backends mặc định
    "DEFAULT_FILTER_BACKENDS"  : [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# CẤU HÌNH JWT (djangorestframework-simplejwt)
# ═══════════════════════════════════════════════════════════════════════════════
SIMPLE_JWT = {
    # Access token ngắn hạn (1 giờ) — nếu bị đánh cắp, thiệt hại giới hạn
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),

    # Refresh token dài hạn (7 ngày) — dùng để lấy access token mới
    # mà không cần đăng nhập lại
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    # True: mỗi lần dùng refresh token sẽ tạo ra refresh token mới
    # Tăng bảo mật nhưng client phải lưu token mới sau mỗi lần refresh
    "ROTATE_REFRESH_TOKENS": True,

    # True: refresh token cũ bị vô hiệu sau khi rotate
    # Ngăn chặn việc dùng lại token cũ nếu bị lộ
    "BLACKLIST_AFTER_ROTATION": True,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,

    # Tên header gửi token: Authorization: Bearer <token>
    "AUTH_HEADER_TYPES": ("Bearer",),

    # Tên key chứa user ID trong payload của token
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# ═══════════════════════════════════════════════════════════════════════════════
# CẤU HÌNH CORS (django-cors-headers)
# ═══════════════════════════════════════════════════════════════════════════════
# Chỉ cho phép Next.js dev server gọi API
# Khi deploy production, đổi thành domain thật của frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",    # Next.js dev server
    "http://127.0.0.1:3000",
]

# Cho phép frontend gửi cookie/credentials cùng request
# Cần thiết nếu dùng HttpOnly cookie để lưu token
CORS_ALLOW_CREDENTIALS = True

# Các HTTP method frontend được phép gọi
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Các header frontend được phép gửi
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",    # Để gửi JWT token
    "content-type",
    "origin",
    "x-csrftoken",
    "x-requested-with",
]


# ═══════════════════════════════════════════════════════════════════════════════
# CẤU HÌNH DRF-SPECTACULAR (Swagger/Redoc)
# ═══════════════════════════════════════════════════════════════════════════════
SPECTACULAR_SETTINGS = {
    "TITLE": "Research Management API",
    "DESCRIPTION": "API cho Hệ thống Quản lý Nghiên cứu Khoa học Sinh viên",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,  # Không hiện endpoint /schema/ trong docs

    # Khai báo security scheme để Swagger UI có nút "Authorize"
    # Cho phép test API với JWT trực tiếp trên giao diện
    "SECURITY": [{"BearerAuth": []}],
    "COMPONENTS": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
}

# ── Cấu hình Media (file người dùng upload) ────────────────────────────────
MEDIA_URL  = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Giới hạn kích thước request body cho upload file (mặc định Django là 2.5MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024   # 25MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024   # 25MB