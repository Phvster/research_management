# api/filters.py

import django_filters
from .models import DeTai, SinhVien, TaiKhoan, TienDo, BaoCao


class DeTaiFilter(django_filters.FilterSet):
    """
    Bộ lọc cho DeTai — dùng trong DeTaiViewSet.
    Hỗ trợ các query params:
      ?TrangThai=CHODUYET
      ?TrangThai=DANGTHUCHIEN
      ?TrangThai=CHONGHIEMTHU
      ?ten=quản lý        ← tìm kiếm không phân biệt hoa thường
    """
    # Lọc chính xác theo trạng thái (dropdown/select trên Frontend)
    TrangThai = django_filters.ChoiceFilter(
        choices=DeTai.TrangThaiDeTai.choices,
        label="Trạng thái đề tài",
    )

    # Tìm kiếm tên đề tài không phân biệt hoa thường (icontains)
    ten = django_filters.CharFilter(
        field_name="TenDeTai",
        lookup_expr="icontains",
        label="Tìm theo tên đề tài",
    )
    nam = django_filters.NumberFilter(
        field_name="NgayTao", 
        lookup_expr="year"
    )

    class Meta:
        model  = DeTai
        fields = ["TrangThai", "ten"]


class SinhVienFilter(django_filters.FilterSet):
    """
    Bộ lọc cho SinhVien — dùng trong SinhVienViewSet.
    Hỗ trợ:
      ?Lop=L04
      ?Khoa=Công nghệ thông tin
      ?ten=Nguyễn        ← tìm theo tên SV
      ?co_de_tai=true    ← lọc SV đã/chưa có đề tài
    """
    ten = django_filters.CharFilter(
        field_name="TenSV",
        lookup_expr="icontains",
        label="Tìm theo tên sinh viên",
    )
    Lop = django_filters.CharFilter(
        field_name="Lop",
        lookup_expr="iexact",   # Khớp chính xác, không phân biệt hoa thường
        label="Lớp",
    )
    Khoa = django_filters.CharFilter(
        field_name="Khoa",
        lookup_expr="icontains",
        label="Khoa",
    )
    # Lọc SV đã có đề tài (MaDeTai không null) hay chưa
    co_de_tai = django_filters.BooleanFilter(
        field_name="MaDeTai",
        lookup_expr="isnull",
        exclude=True,           # exclude=True → isnull=False khi co_de_tai=true
        label="Đã có đề tài",
    )

    class Meta:
        model  = SinhVien
        fields = ["ten", "Lop", "Khoa", "co_de_tai"]


class TaiKhoanFilter(django_filters.FilterSet):
    """
    Bộ lọc cho TaiKhoan — dùng trong TaiKhoanViewSet.
    Hỗ trợ:
      ?QuyenHan=SINHVIEN
      ?TrangThai=1
    """
    QuyenHan = django_filters.ChoiceFilter(
        choices=TaiKhoan.QuyenHanChoices.choices,
        label="Quyền hạn",
    )
    TrangThai = django_filters.NumberFilter(
        field_name="TrangThai",
        label="Trạng thái (1=Hoạt động, 0=Bị khóa)",
    )

    class Meta:
        model  = TaiKhoan
        fields = ["QuyenHan", "TrangThai"]


class TienDoFilter(django_filters.FilterSet):
    """
    Bộ lọc cho TienDo — lọc theo đề tài hoặc khoảng tỷ lệ.
    Hỗ trợ:
      ?MaDeTai=DT001
      ?ty_le_tu=50&ty_le_den=100   ← Lọc tiến độ từ 50% đến 100%
    """
    ty_le_tu = django_filters.NumberFilter(
        field_name="TyLeHoanThanh",
        lookup_expr="gte",
        label="Tỷ lệ từ (%)",
    )
    ty_le_den = django_filters.NumberFilter(
        field_name="TyLeHoanThanh",
        lookup_expr="lte",
        label="Tỷ lệ đến (%)",
    )

    class Meta:
        model  = TienDo
        fields = ["MaDeTai", "ty_le_tu", "ty_le_den"]