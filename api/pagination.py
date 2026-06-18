# api/pagination.py

from rest_framework.pagination import PageNumberPagination
from rest_framework.response  import Response


class ChuanPagination(PageNumberPagination):
    """
    Lớp phân trang chuẩn cho toàn dự án.

    Query params:
      ?page=2          ← số trang (mặc định: 1)
      ?page_size=20    ← số bản ghi/trang (mặc định: 10, tối đa: 100)

    Response bổ sung thêm các trường meta hữu ích cho Frontend:
      - total_pages  : tổng số trang
      - current_page : trang hiện tại
      - page_size    : số bản ghi trên trang này
    """
    # Mặc định 10 bản ghi/trang
    page_size = 10

    # Cho phép Frontend tự điều chỉnh số bản ghi/trang
    page_size_query_param = "page_size"

    # Giới hạn tối đa để tránh load quá nhiều dữ liệu 1 lúc
    max_page_size = 100

    # Tên query param cho số trang
    page_query_param = "page"

    def get_paginated_response(self, data):
        """
        Override để trả về response với cấu trúc nhất quán và
        đầy đủ thông tin phân trang cho Frontend dễ render UI.
        """
        return Response({
            # ── Metadata phân trang ──────────────────────────────────────
            "pagination": {
                "total_records" : self.page.paginator.count,
                "total_pages"   : self.page.paginator.num_pages,
                "current_page"  : self.page.number,
                "page_size"     : self.get_page_size(self.request),
                "has_next"      : self.page.has_next(),
                "has_previous"  : self.page.has_previous(),
                "next_url"      : self.get_next_link(),
                "previous_url"  : self.get_previous_link(),
            },
            # ── Dữ liệu thực ─────────────────────────────────────────────
            "results": data,
        })

    def get_paginated_response_schema(self, schema):
        """Mô tả schema cho Swagger/OpenAPI tự động sinh từ drf-spectacular."""
        return {
            "type": "object",
            "properties": {
                "pagination": {
                    "type": "object",
                    "properties": {
                        "total_records" : {"type": "integer"},
                        "total_pages"   : {"type": "integer"},
                        "current_page"  : {"type": "integer"},
                        "page_size"     : {"type": "integer"},
                        "has_next"      : {"type": "boolean"},
                        "has_previous"  : {"type": "boolean"},
                        "next_url"      : {"type": "string", "nullable": True},
                        "previous_url"  : {"type": "string", "nullable": True},
                    },
                },
                "results": schema,
            },
        }


class NhoPagination(ChuanPagination):
    """Phân trang 5 bản ghi/trang — dùng cho các danh sách ngắn như HoiDong."""
    page_size = 5


class LonPagination(ChuanPagination):
    """Phân trang 20 bản ghi/trang — dùng cho TienDo (nhiều bản ghi)."""
    page_size     = 20
    max_page_size = 200