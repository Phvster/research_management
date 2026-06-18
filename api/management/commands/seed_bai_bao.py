# api/management/commands/seed_bai_bao.py
"""
Command tạo 20 bài báo NCKH mẫu cho Landing Page.
Chạy: python manage.py seed_bai_bao
      python manage.py seed_bai_bao --reset  (xóa cũ trước khi tạo)
"""

from django.core.management.base import BaseCommand
from api.models import BaiBaoNCKH


# ══════════════════════════════════════════════════════════════════════════════
# DỮ LIỆU MẪU — 20 bài báo NCKH
# Lấy từ danh sách thiết kế, hardcode để đảm bảo nội dung có nghĩa
# ══════════════════════════════════════════════════════════════════════════════
DANH_SACH_BAI_BAO = [
    {
        "TenDeTai"      : "Hệ thống phát hiện xâm nhập mạng (IDS) ứng dụng Trí tuệ nhân tạo",
        "TacGia"        : "TS. Nguyễn Văn A (Chủ trì)",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHAT,
        "AnhBia"        : "https://picsum.photos/seed/ids/400/250",
        "TomTat"        : (
            "Xây dựng hệ thống IDS thế hệ mới ứng dụng học sâu, "
            "nhận diện tấn công Zero-day với độ chính xác cao."
        ),
        "NoiDungChiTiet": (
            "<h2>Tổng quan đề tài</h2>"
            "<p>Đề tài nghiên cứu và xây dựng hệ thống phát hiện xâm nhập mạng (IDS) "
            "thế hệ mới. Ứng dụng các mô hình học sâu, hệ thống có khả năng nhận diện "
            "các cuộc tấn công Zero-day với độ chính xác cao, giảm thiểu tỷ lệ cảnh báo "
            "giả so với phương pháp truyền thống.</p>"
            "<h2>Phương pháp nghiên cứu</h2>"
            "<p>Nhóm tác giả sử dụng kiến trúc BiLSTM kết hợp Attention Mechanism để "
            "phân tích luồng dữ liệu mạng theo thời gian thực. Bộ dữ liệu huấn luyện "
            "gồm hơn 2 triệu gói tin từ môi trường testbed thực tế.</p>"
            "<h2>Kết quả đạt được</h2>"
            "<ul><li>Độ chính xác phát hiện tấn công: 97.3%</li>"
            "<li>Tỷ lệ cảnh báo giả (False Positive): giảm 68% so với Snort</li>"
            "<li>Độ trễ phân tích mỗi gói tin: &lt; 2ms</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Ứng dụng Blockchain trong quản lý dữ liệu y tế an toàn",
        "TacGia"        : "ThS. Lê Thị B (Chủ trì)",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/blockchain/400/250",
        "TomTat"        : (
            "Nền tảng quản lý hồ sơ bệnh án điện tử trên Blockchain, "
            "đảm bảo toàn vẹn dữ liệu và chia sẻ an toàn giữa các bệnh viện."
        ),
        "NoiDungChiTiet": (
            "<h2>Giới thiệu</h2>"
            "<p>Nghiên cứu đề xuất một nền tảng quản lý hồ sơ bệnh án điện tử dựa trên "
            "công nghệ chuỗi khối (Blockchain). Đề tài đảm bảo tính toàn vẹn của dữ liệu "
            "bệnh nhân, ngăn chặn sửa đổi trái phép và cho phép chia sẻ thông tin an toàn "
            "giữa các bệnh viện.</p>"
            "<h2>Kiến trúc hệ thống</h2>"
            "<p>Hệ thống sử dụng Hyperledger Fabric làm nền tảng blockchain riêng tư, "
            "kết hợp IPFS để lưu trữ phân tán các tệp ảnh chụp X-quang và MRI. "
            "Smart Contract kiểm soát quyền truy cập theo vai trò (RBAC).</p>"
            "<h2>Đánh giá bảo mật</h2>"
            "<ul><li>Chống giả mạo: Hash SHA-256 cho mỗi bản ghi</li>"
            "<li>Kiểm toán đầy đủ: Audit log không thể xóa</li>"
            "<li>Tuân thủ: HIPAA & ISO 27001</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Phân tích nền tảng mật mã lượng tử và ứng dụng tương lai",
        "TacGia"        : "TS. Trần Văn C (Chủ trì)",
        "NamHoanThanh"  : 2022,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.BA,
        "AnhBia"        : "https://picsum.photos/seed/quantum/400/250",
        "TomTat"        : (
            "Nghiên cứu nguyên lý mật mã học lượng tử và giao thức QKD, "
            "mở hướng bảo vệ thông tin trước kỷ nguyên máy tính lượng tử."
        ),
        "NoiDungChiTiet": (
            "<h2>Bối cảnh nghiên cứu</h2>"
            "<p>Bài báo trình bày các nguyên lý cơ bản của mật mã học lượng tử "
            "(Quantum Cryptography) và phân tích giao thức phân phối khóa lượng tử (QKD). "
            "Kết quả mở ra hướng đi mới trong việc bảo vệ an toàn thông tin trước sự ra đời "
            "của máy tính lượng tử.</p>"
            "<h2>Giao thức BB84</h2>"
            "<p>Nhóm nghiên cứu thực nghiệm giao thức BB84 trên kênh quang học trong "
            "phòng lab, đạt khoảng cách truyền khóa 50km với tỷ lệ lỗi bit (QBER) "
            "duy trì dưới 11% — ngưỡng an toàn theo lý thuyết thông tin lượng tử.</p>"
            "<h2>Định hướng ứng dụng</h2>"
            "<ul><li>Bảo mật đường truyền ngân hàng liên ngân hàng</li>"
            "<li>Hạ tầng chính phủ điện tử thế hệ kế tiếp</li>"
            "<li>Tích hợp với Post-Quantum Cryptography (PQC) của NIST</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Xây dựng công cụ dịch thuật thông minh hỗ trợ tự học tiếng Anh",
        "TacGia"        : "Nhóm SV: Minh Phúc, Thanh Ngân",
        "NamHoanThanh"  : 2025,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.KHUYEN_KHICH,
        "AnhBia"        : "https://picsum.photos/seed/nlp/400/250",
        "TomTat"        : (
            "Ứng dụng dịch thuật cá nhân hóa tích hợp NLP, "
            "giúp người dùng tự đánh giá và cải thiện kỹ năng biên dịch Anh-Việt."
        ),
        "NoiDungChiTiet": (
            "<h2>Mô tả dự án</h2>"
            "<p>Dự án phát triển một ứng dụng dịch thuật cá nhân hóa, tích hợp xử lý "
            "ngôn ngữ tự nhiên (NLP) để cung cấp phản hồi ngôn ngữ theo ngữ cảnh. "
            "Công cụ giúp người dùng tự đánh giá và cải thiện kỹ năng biên dịch "
            "Anh-Việt một cách chủ động.</p>"
            "<h2>Công nghệ sử dụng</h2>"
            "<p>Backend: FastAPI + MarianMT (Helsinki-NLP). Frontend: React Native. "
            "Tích hợp GPT-4 để giải thích sắc thái ngữ nghĩa và đề xuất cách dịch "
            "tự nhiên hơn trong ngữ cảnh học thuật.</p>"
            "<h2>Kết quả thử nghiệm</h2>"
            "<ul><li>500 người dùng beta trong 3 tháng</li>"
            "<li>Điểm BLEU trung bình cải thiện 15% sau 4 tuần</li>"
            "<li>4.2/5 điểm đánh giá từ người dùng</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Tối ưu hóa nhận dạng vật thể thời gian thực với Faster R-CNN",
        "TacGia"        : "Nhóm SV: Bá Hải, Minh Phúc",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/rcnn/400/250",
        "TomTat"        : (
            "Tinh chỉnh và tối ưu Faster R-CNN cho thiết bị Edge, "
            "đạt tốc độ cao hơn 20% trong khi giữ nguyên độ chính xác mAP."
        ),
        "NoiDungChiTiet": (
            "<h2>Vấn đề đặt ra</h2>"
            "<p>Nghiên cứu tập trung vào việc tinh chỉnh và tối ưu hóa kiến trúc "
            "mạng nơ-ron tích chập khu vực (Faster R-CNN). Mục tiêu là triển khai "
            "thực tế trên thiết bị Edge có tài nguyên hạn chế như Raspberry Pi 4 "
            "và Jetson Nano.</p>"
            "<h2>Phương pháp tối ưu</h2>"
            "<p>Áp dụng kết hợp: (1) Pruning loại bỏ 40% trọng số ít quan trọng, "
            "(2) Quantization INT8 giảm kích thước model từ 550MB xuống 140MB, "
            "(3) Knowledge Distillation từ model teacher ResNet-101.</p>"
            "<h2>Kết quả thực nghiệm</h2>"
            "<ul><li>FPS tăng từ 8.3 lên 10.2 trên Jetson Nano (+20%)</li>"
            "<li>mAP@0.5 giữ nguyên: 73.2% (giảm không đáng kể 0.8%)</li>"
            "<li>Tiêu thụ RAM giảm 58%</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Bảo mật hệ thống IoT bằng giao thức mã hóa hạng nhẹ",
        "TacGia"        : "TS. Hoàng Đình D (Chủ trì)",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHAT,
        "AnhBia"        : "https://picsum.photos/seed/iot/400/250",
        "TomTat"        : (
            "Thuật toán mã hóa hạng nhẹ tối ưu cho IoT, "
            "đảm bảo an toàn truyền tải dữ liệu mà không tiêu hao quá mức năng lượng."
        ),
        "NoiDungChiTiet": (
            "<h2>Thách thức IoT Security</h2>"
            "<p>Đề tài đề xuất một thuật toán mã hóa hạng nhẹ (Lightweight Cryptography) "
            "tối ưu cho các thiết bị IoT có tài nguyên hạn chế. Thuật toán đảm bảo "
            "an toàn truyền tải dữ liệu mà không làm tiêu hao quá mức năng lượng "
            "của cảm biến.</p>"
            "<h2>Thuật toán đề xuất: PRESENT-X</h2>"
            "<p>Dựa trên nền tảng thuật toán PRESENT (ISO/IEC 29192-2), nhóm cải tiến "
            "thêm lớp Key Schedule và S-Box để tăng khả năng kháng tấn công vi phân. "
            "Cài đặt trên vi điều khiển ARM Cortex-M0 với 2KB SRAM.</p>"
            "<h2>Đánh giá hiệu năng</h2>"
            "<ul><li>Tiêu thụ năng lượng: 3.2µJ/block (thấp hơn AES-128 89%)</li>"
            "<li>Tốc độ mã hóa: 1.2Mbps trên 16MHz MCU</li>"
            "<li>An toàn: Đạt 80-bit security level</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Phân tích mã độc tống tiền (Ransomware) họ Crypto",
        "TacGia"        : "ThS. Phạm Văn E",
        "NamHoanThanh"  : 2022,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.BA,
        "AnhBia"        : "https://picsum.photos/seed/malware/400/250",
        "TomTat"        : (
            "Phân tích kỹ thuật dịch ngược các biến thể Ransomware mới, "
            "đề xuất IoC và phương pháp giám sát hành vi phòng ngừa sớm."
        ),
        "NoiDungChiTiet": (
            "<h2>Bối cảnh nghiên cứu</h2>"
            "<p>Báo cáo phân tích kỹ thuật dịch ngược (Reverse Engineering) đối với "
            "một số biến thể mã độc Ransomware mới. Qua đó, nhóm tác giả đề xuất "
            "các chỉ số thỏa hiệp (IoC) và phương pháp giám sát hành vi để phòng ngừa sớm.</p>"
            "<h2>Phương pháp phân tích</h2>"
            "<p>Kết hợp phân tích tĩnh (IDA Pro, Ghidra) và phân tích động trong môi trường "
            "sandbox Cuckoo. Nhóm xác định được 3 biến thể mới của LockBit 3.0 với cơ chế "
            "né tránh sandbox tinh vi hơn phiên bản gốc.</p>"
            "<h2>Kết quả và khuyến nghị</h2>"
            "<ul><li>Phát hiện 47 IoC mới (hash, domain, registry key)</li>"
            "<li>Quy tắc YARA để phát hiện sớm: độ chính xác 94%</li>"
            "<li>Khuyến nghị: Disable VSS, monitor LSASS memory access</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Ứng dụng học sâu trong chẩn đoán ảnh y khoa MRI",
        "TacGia"        : "Nhóm SV: Nguyễn Văn X, Trần Thị Y",
        "NamHoanThanh"  : 2025,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/mri/400/250",
        "TomTat"        : (
            "Mạng CNN phân đoạn và phát hiện khối u trên ảnh MRI, "
            "hỗ trợ bác sĩ đẩy nhanh quy trình chẩn đoán lâm sàng."
        ),
        "NoiDungChiTiet": (
            "<h2>Mục tiêu nghiên cứu</h2>"
            "<p>Sử dụng mạng nơ-ron tích chập (CNN) để phân đoạn và phát hiện các khối u "
            "bất thường trên ảnh cộng hưởng từ (MRI). Hệ thống đóng vai trò như một trợ lý "
            "ảo, giúp bác sĩ đẩy nhanh quá trình chẩn đoán lâm sàng.</p>"
            "<h2>Kiến trúc nnU-Net tùy chỉnh</h2>"
            "<p>Nhóm áp dụng kiến trúc nnU-Net (no-new-Net) với Residual connections và "
            "Deep Supervision để xử lý ảnh MRI 3D đa lớp. Data augmentation sử dụng "
            "Elastic deformation và Random rotation để tăng tính đa dạng tập huấn luyện.</p>"
            "<h2>Kết quả lâm sàng</h2>"
            "<ul><li>Dice Score trên tập test: 0.891 (Glioblastoma)</li>"
            "<li>Sensitivity: 93.2%, Specificity: 97.8%</li>"
            "<li>Thời gian phân tích mỗi ca: 45 giây (vs. 15 phút thủ công)</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Kiến trúc Microservices trong ứng dụng quản lý đào tạo",
        "TacGia"        : "TS. Vũ Thanh F (Chủ trì)",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.KHUYEN_KHICH,
        "AnhBia"        : "https://picsum.photos/seed/microservices/400/250",
        "TomTat"        : (
            "Thực nghiệm chuyển đổi hệ thống nguyên khối sang Microservices, "
            "đánh giá hiệu năng và khả năng chịu tải trên Docker/Kubernetes."
        ),
        "NoiDungChiTiet": (
            "<h2>Động lực chuyển đổi</h2>"
            "<p>Đề tài thực nghiệm việc chuyển đổi một hệ thống nguyên khối (Monolithic) "
            "sang kiến trúc Microservices. Đánh giá chi tiết về hiệu năng, khả năng chịu tải "
            "và tính dễ bảo trì khi triển khai trên môi trường Docker/Kubernetes.</p>"
            "<h2>Kiến trúc đề xuất</h2>"
            "<p>Hệ thống được tách thành 7 microservice: Auth, Student, Course, Grade, "
            "Notification, Report và API Gateway. Giao tiếp nội bộ qua gRPC, "
            "hàng đợi bất đồng bộ qua RabbitMQ. Triển khai trên K8s với Helm chart.</p>"
            "<h2>So sánh hiệu năng</h2>"
            "<ul><li>Throughput: tăng 340% khi scale horizontal</li>"
            "<li>Deploy time: giảm từ 45 phút xuống 8 phút (CI/CD)</li>"
            "<li>MTTR (Mean Time to Recovery): giảm 72%</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Công cụ rà quét lỗ hổng bảo mật Web tự động",
        "TacGia"        : "Nhóm SV: An, Bình, Cường",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.BA,
        "AnhBia"        : "https://picsum.photos/seed/webscan/400/250",
        "TomTat"        : (
            "Phần mềm mã nguồn mở tự động quét OWASP Top 10, "
            "cung cấp báo cáo chi tiết và gợi ý mã khắc phục lỗ hổng."
        ),
        "NoiDungChiTiet": (
            "<h2>Vấn đề giải quyết</h2>"
            "<p>Xây dựng phần mềm mã nguồn mở cho phép tự động quét và đánh giá "
            "các lỗ hổng OWASP Top 10 trên các ứng dụng Web hiện đại. Công cụ "
            "cung cấp báo cáo chi tiết và gợi ý các đoạn mã khắc phục lỗ hổng.</p>"
            "<h2>Các module phát hiện</h2>"
            "<p>Công cụ gồm 5 module: SQL Injection Scanner, XSS Detector, "
            "CSRF Token Analyzer, SSRF Probe và Directory Traversal Fuzzer. "
            "Tích hợp với Burp Suite qua REST API và xuất báo cáo SARIF/HTML.</p>"
            "<h2>Kết quả kiểm thử</h2>"
            "<ul><li>Phát hiện 94% lỗ hổng trên bộ benchmark OWASP WebGoat</li>"
            "<li>False Positive Rate: 6.2%</li>"
            "<li>Star trên GitHub: 1,240 (3 tháng sau release)</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Nhà thông minh điều khiển bằng giọng nói tiếng Việt",
        "TacGia"        : "ThS. Ngô Văn G",
        "NamHoanThanh"  : 2022,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHAT,
        "AnhBia"        : "https://picsum.photos/seed/smarthome/400/250",
        "TomTat"        : (
            "Bộ điều khiển Local Hub không phụ thuộc đám mây, "
            "tích hợp STT tiếng Việt điều khiển thiết bị điện gia đình."
        ),
        "NoiDungChiTiet": (
            "<h2>Giải pháp đề xuất</h2>"
            "<p>Phát triển một bộ điều khiển trung tâm cục bộ (Local Hub) không phụ thuộc "
            "vào đám mây, tích hợp mô hình nhận dạng giọng nói tiếng Việt tự nhiên "
            "(Speech-to-Text) để điều khiển các thiết bị điện trong gia đình.</p>"
            "<h2>Mô hình nhận dạng giọng nói</h2>"
            "<p>Fine-tune mô hình Whisper-small của OpenAI trên 500 giờ dữ liệu "
            "giọng nói tiếng Việt tổng hợp từ nhiều vùng miền. Chạy offline trên "
            "Raspberry Pi 5 với độ trễ phản hồi dưới 400ms.</p>"
            "<h2>Tích hợp hệ sinh thái</h2>"
            "<ul><li>Giao thức: Zigbee 3.0 + Z-Wave cho thiết bị IoT</li>"
            "<li>Hỗ trợ 127 loại lệnh tiếng Việt tự nhiên</li>"
            "<li>WER (Word Error Rate): 4.3% trong môi trường có tiếng ồn</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Triển khai hệ thống chữ ký số di động (Mobile PKI)",
        "TacGia"        : "TS. Đinh Thị H",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/pki/400/250",
        "TomTat"        : (
            "Lưu trữ chứng thư số an toàn trên chip Secure Enclave của điện thoại, "
            "đơn giản hóa ký duyệt tài liệu hành chính điện tử."
        ),
        "NoiDungChiTiet": (
            "<h2>Bối cảnh chính phủ số</h2>"
            "<p>Nghiên cứu giải pháp lưu trữ chứng thư số an toàn trên thiết bị di động "
            "bằng cách sử dụng chip bảo mật phần cứng (Secure Enclave). Ứng dụng giúp "
            "đơn giản hóa quy trình ký duyệt tài liệu hành chính điện tử.</p>"
            "<h2>Kiến trúc bảo mật</h2>"
            "<p>Khóa riêng tư RSA-2048 được sinh và lưu hoàn toàn trong TEE "
            "(Trusted Execution Environment) của chip. Không bao giờ xuất khóa "
            "ra ngoài TEE. Xác thực chủ sở hữu bằng sinh trắc học Face ID/Touch ID.</p>"
            "<h2>Tuân thủ pháp lý</h2>"
            "<ul><li>Đạt chuẩn: ETSI EN 419 241 và Nghị định 130/2018/NĐ-CP</li>"
            "<li>Tích hợp với hệ thống một cửa điện tử 12 tỉnh thành</li>"
            "<li>Thời gian ký số: &lt; 1.5 giây</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Phân tích cảm xúc bình luận mạng xã hội bằng PhoBERT",
        "TacGia"        : "Nhóm SV: Khoa, Linh",
        "NamHoanThanh"  : 2025,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.BA,
        "AnhBia"        : "https://picsum.photos/seed/sentiment/400/250",
        "TomTat"        : (
            "Fine-tuning PhoBERT phân loại cảm xúc bình luận tiếng Việt "
            "hỗ trợ doanh nghiệp đo lường mức độ hài lòng khách hàng."
        ),
        "NoiDungChiTiet": (
            "<h2>Phát biểu bài toán</h2>"
            "<p>Huấn luyện tinh chỉnh (fine-tuning) mô hình ngôn ngữ PhoBERT để phân loại "
            "cảm xúc (Tích cực, Tiêu cực, Trung lập) từ các bình luận trên mạng xã hội. "
            "Ứng dụng hỗ trợ doanh nghiệp đo lường mức độ hài lòng của khách hàng.</p>"
            "<h2>Xây dựng tập dữ liệu</h2>"
            "<p>Thu thập và gán nhãn 85,000 bình luận từ Facebook, TikTok và Shopee "
            "về 5 lĩnh vực: thương mại điện tử, ẩm thực, du lịch, giải trí và giáo dục. "
            "Sử dụng Inter-Annotator Agreement (Cohen's Kappa = 0.82) để đảm bảo chất lượng.</p>"
            "<h2>Kết quả phân loại</h2>"
            "<ul><li>F1-score Macro: 0.887 trên tập test</li>"
            "<li>Vượt trội 8.3% so với mô hình SVM baseline</li>"
            "<li>API xử lý: 2,000 request/giây trên GPU T4</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Phát hiện gian lận giao dịch ngân hàng theo thời gian thực",
        "TacGia"        : "ThS. Lý Công K",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHAT,
        "AnhBia"        : "https://picsum.photos/seed/fraud/400/250",
        "TomTat"        : (
            "Random Forest kết hợp XGBoost đánh giá rủi ro giao dịch, "
            "đóng băng giao dịch đáng ngờ trong chưa đầy 100ms."
        ),
        "NoiDungChiTiet": (
            "<h2>Tổng quan hệ thống</h2>"
            "<p>Sử dụng các thuật toán máy học phân loại rừng ngẫu nhiên (Random Forest) "
            "kết hợp XGBoost để đánh giá rủi ro của từng luồng giao dịch. Hệ thống có "
            "khả năng đóng băng các giao dịch đáng ngờ trong vòng chưa đầy 100ms.</p>"
            "<h2>Pipeline xử lý dữ liệu</h2>"
            "<p>Luồng dữ liệu: Kafka → Feature Engineering (30+ đặc trưng hành vi) → "
            "Ensemble Model → Risk Score → Rule Engine → Block/Allow. "
            "Tái huấn luyện tự động mỗi 24 giờ với dữ liệu giao dịch mới.</p>"
            "<h2>Kết quả vận hành thực tế</h2>"
            "<ul><li>Phát hiện 98.7% giao dịch gian lận (Recall)</li>"
            "<li>False Positive Rate: 0.3% (quan trọng với trải nghiệm KH)</li>"
            "<li>Tiết kiệm ước tính: 2.3 tỷ VNĐ/tháng</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Tối ưu hóa truy vấn trên cơ sở dữ liệu phân tán",
        "TacGia"        : "TS. Châu Văn M",
        "NamHoanThanh"  : 2022,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.KHUYEN_KHICH,
        "AnhBia"        : "https://picsum.photos/seed/database/400/250",
        "TomTat"        : (
            "Chiến lược caching mới giải quyết bottleneck đồng bộ dữ liệu "
            "đa vùng địa lý, giảm độ trễ truy vấn tới 40%."
        ),
        "NoiDungChiTiet": (
            "<h2>Bài toán phân tán</h2>"
            "<p>Đề tài giải quyết bài toán nút thắt cổ chai (bottleneck) khi đồng bộ "
            "dữ liệu giữa các node máy chủ đặt ở nhiều khu vực địa lý khác nhau. "
            "Đề xuất một chiến lược caching mới giúp giảm độ trễ truy vấn tới 40%.</p>"
            "<h2>Giải pháp đề xuất: Adaptive Tiered Caching</h2>"
            "<p>Kết hợp 3 tầng: L1 (in-process LRU cache), L2 (Redis Cluster), "
            "L3 (Read Replica gần nhất theo địa lý). Thuật toán dự đoán hot key "
            "bằng sliding window access pattern để pre-warm cache.</p>"
            "<h2>Kết quả thực nghiệm</h2>"
            "<ul><li>P99 latency: giảm từ 340ms xuống 204ms (-40%)</li>"
            "<li>Cache Hit Rate L1+L2: 87.3%</li>"
            "<li>Chi phí bandwidth inter-region: giảm 55%</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Hệ thống tự động phát hiện tin giả (Fake News)",
        "TacGia"        : "Nhóm SV: Oanh, Phương, Quân",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/fakenews/400/250",
        "TomTat"        : (
            "Kết hợp NLP và Graph Neural Networks phát hiện sớm nguồn phát tán tin giả, "
            "cảnh báo trực tiếp qua extension trình duyệt."
        ),
        "NoiDungChiTiet": (
            "<h2>Thách thức phát hiện tin giả</h2>"
            "<p>Dự án kết hợp phân tích văn bản và phân tích biểu đồ lan truyền mạng lưới "
            "(Graph Neural Networks) để nhận dạng sớm các nguồn phát tán tin giả mạo. "
            "Hệ thống có tiện ích mở rộng (extension) cảnh báo trực tiếp trên trình duyệt.</p>"
            "<h2>Mô hình kết hợp</h2>"
            "<p>Text Branch: RoBERTa phân loại nội dung bài viết. "
            "Graph Branch: GraphSAGE phân tích propagation tree của tweet/post. "
            "Fusion Layer: Attention-based late fusion kết hợp 2 nhánh.</p>"
            "<h2>Hiệu quả phát hiện</h2>"
            "<ul><li>Accuracy tổng thể: 91.4% trên FakeNewsNet dataset</li>"
            "<li>Phát hiện sớm trong 2 giờ đầu lan truyền: 78%</li>"
            "<li>Người dùng extension: 8,500 sau 2 tháng</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Đánh giá an toàn các giao thức định tuyến mạng SDN",
        "TacGia"        : "TS. Trịnh Xuân N",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.BA,
        "AnhBia"        : "https://picsum.photos/seed/sdn/400/250",
        "TomTat"        : (
            "Phân tích các kịch bản tấn công DDoS vào SDN Controller "
            "và đề xuất cơ chế phòng vệ chuyển đổi dự phòng."
        ),
        "NoiDungChiTiet": (
            "<h2>SDN và rủi ro tập trung</h2>"
            "<p>Mạng định nghĩa bằng phần mềm (SDN) mang lại sự linh hoạt nhưng cũng "
            "tạo ra rủi ro tập trung. Bài báo trình bày các kịch bản tấn công DDoS vào "
            "bộ điều khiển trung tâm (Controller) và đề xuất cơ chế phòng vệ.</p>"
            "<h2>Mô hình tấn công phân tích</h2>"
            "<p>3 vector tấn công chính: (1) Control Plane Flooding làm cạn kiệt "
            "tài nguyên Controller, (2) Flow Table Overflow làm cạn bộ nhớ Switch "
            "OpenFlow, (3) Cross-plane Poisoning giả mạo topology. "
            "Mô phỏng trên Mininet với POX Controller.</p>"
            "<h2>Cơ chế phòng vệ đề xuất</h2>"
            "<ul><li>Distributed Controller Cluster với Raft consensus</li>"
            "<li>Entropy-based anomaly detection cho flow entries</li>"
            "<li>Recovery time sau tấn công: &lt; 3 giây</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Nghiên cứu ứng dụng hợp đồng thông minh (Smart Contract)",
        "TacGia"        : "ThS. Đỗ Thị P",
        "NamHoanThanh"  : 2025,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.KHUYEN_KHICH,
        "AnhBia"        : "https://picsum.photos/seed/contract/400/250",
        "TomTat"        : (
            "Smart Contract tự động hóa thanh toán chuỗi cung ứng nông sản, "
            "tăng minh bạch và loại bỏ khâu trung gian qua Web3."
        ),
        "NoiDungChiTiet": (
            "<h2>Bài toán chuỗi cung ứng</h2>"
            "<p>Áp dụng Web3 vào chuỗi cung ứng nông sản, sử dụng Smart Contract "
            "để tự động hóa quá trình thanh toán khi hàng hóa được xác nhận giao đến nơi "
            "an toàn. Tăng tính minh bạch và loại bỏ khâu trung gian.</p>"
            "<h2>Thiết kế Smart Contract</h2>"
            "<p>Viết bằng Solidity 0.8.x trên nền Polygon (gas phí thấp). "
            "Contract Escrow giữ tiền, tự động giải ngân khi Oracle IoT xác nhận "
            "nhiệt độ kho lạnh hợp lệ trong suốt hành trình vận chuyển.</p>"
            "<h2>Kết quả thí điểm</h2>"
            "<ul><li>300 hợp đồng thanh toán tự động trong 3 tháng thí điểm</li>"
            "<li>Tranh chấp thanh toán: giảm từ 12% xuống 1.2%</li>"
            "<li>Thời gian quyết toán: từ 7 ngày xuống 4 giờ</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Sinh ca kiểm thử phần mềm tự động bằng AI",
        "TacGia"        : "Nhóm SV: Tùng, Uyên",
        "NamHoanThanh"  : 2024,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHI,
        "AnhBia"        : "https://picsum.photos/seed/testing/400/250",
        "TomTat"        : (
            "LLM phân tích yêu cầu phần mềm tự động sinh Test Script Selenium, "
            "loại bỏ công đoạn viết test case thủ công."
        ),
        "NoiDungChiTiet": (
            "<h2>Thách thức kiểm thử phần mềm</h2>"
            "<p>Thay vì viết Test Case thủ công, hệ thống sử dụng Large Language Models (LLMs) "
            "phân tích yêu cầu phần mềm để tự động sinh ra các kịch bản kiểm thử (Test Scripts) "
            "chạy trực tiếp trên nền tảng Selenium.</p>"
            "<h2>Quy trình tự động</h2>"
            "<p>Pipeline: User Story (Jira) → GPT-4 Turbo với custom prompt → "
            "Test Script (Python/Selenium) → Validation Agent kiểm tra cú pháp → "
            "CI Runner thực thi → Báo cáo kết quả. "
            "Fine-tune trên 10,000 cặp (User Story, Test Script) thực tế.</p>"
            "<h2>Hiệu quả đo lường</h2>"
            "<ul><li>Test coverage tự động đạt: 73% so với thủ công</li>"
            "<li>Thời gian sinh test: 8 phút/feature (vs. 2 giờ thủ công)</li>"
            "<li>Pass rate lần đầu: 67% (không cần sửa)</li></ul>"
        ),
    },
    {
        "TenDeTai"      : "Giải pháp chống rò rỉ dữ liệu (DLP) mã nguồn mở",
        "TacGia"        : "TS. Bùi Minh Q",
        "NamHoanThanh"  : 2023,
        "GiaiThuong"    : BaiBaoNCKH.GiaiThuongBaoCao.NHAT,
        "AnhBia"        : "https://picsum.photos/seed/dlp/400/250",
        "TomTat"        : (
            "Agent giám sát máy trạm ngăn chặn copy dữ liệu nhạy cảm "
            "ra USB hay cloud cá nhân trái phép."
        ),
        "NoiDungChiTiet": (
            "<h2>Vấn đề rò rỉ nội bộ</h2>"
            "<p>Xây dựng một agent giám sát cài đặt trên máy trạm, có khả năng ngăn chặn "
            "người dùng copy các dữ liệu nhạy cảm (mã nguồn, tệp khách hàng) ra USB "
            "hoặc tải lên các nền tảng lưu trữ đám mây cá nhân trái phép.</p>"
            "<h2>Cơ chế phát hiện</h2>"
            "<p>Kết hợp: (1) Content Inspection — regex + ML phân loại nội dung nhạy cảm, "
            "(2) Context Awareness — ai đang copy, từ ứng dụng nào, lúc mấy giờ, "
            "(3) Destination Control — whitelist domain cho phép upload. "
            "Agent viết bằng Rust, tiêu thụ &lt; 0.5% CPU idle.</p>"
            "<h2>Triển khai thực tế</h2>"
            "<ul><li>Hỗ trợ: Windows 10/11, macOS 13+, Ubuntu 22.04</li>"
            "<li>Ngăn chặn 99.1% sự cố rò rỉ có chủ đích trong thử nghiệm</li>"
            "<li>Không gây ảnh hưởng đến năng suất người dùng bình thường</li></ul>"
        ),
    },
]


class Command(BaseCommand):
    help = "Tạo 20 bài báo NCKH mẫu cho Landing Page (BaiBaoNCKH)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Xóa toàn bộ BaiBaoNCKH cũ trước khi tạo mới.",
        )

    def handle(self, *args, **options):
        self.stdout.write("\n" + "═" * 55)
        self.stdout.write(self.style.SUCCESS("  SEED BÀI BÁO NCKH — Landing Page"))
        self.stdout.write("═" * 55)

        # ── Xóa dữ liệu cũ nếu có flag --reset ──────────────────────────
        if options["reset"]:
            so_cu = BaiBaoNCKH.objects.count()
            BaiBaoNCKH.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"🗑️  Đã xóa {so_cu} bài báo cũ.\n"))

        # ── Tạo từng bài báo ─────────────────────────────────────────────
        so_tao_moi = 0
        so_bo_qua  = 0

        for i, bb in enumerate(DANH_SACH_BAI_BAO, start=1):
            # Tránh tạo trùng nếu không dùng --reset
            obj, created = BaiBaoNCKH.objects.get_or_create(
                TenDeTai=bb["TenDeTai"],
                defaults={
                    "TacGia"        : bb["TacGia"],
                    "NamHoanThanh"  : bb["NamHoanThanh"],
                    "GiaiThuong"    : bb["GiaiThuong"],
                    "AnhBia"        : bb["AnhBia"],
                    "TomTat"        : bb["TomTat"],
                    "NoiDungChiTiet": bb["NoiDungChiTiet"],
                    "IsActive"      : True,
                },
            )

            if created:
                so_tao_moi += 1
                giai = obj.get_GiaiThuong_display()
                self.stdout.write(
                    f"   ✓ [{i:02d}] {giai:<18} {obj.TenDeTai[:50]}"
                )
            else:
                so_bo_qua += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"   ~ [{i:02d}] Đã tồn tại (bỏ qua): {obj.TenDeTai[:45]}"
                    )
                )

        # ── Tóm tắt kết quả ──────────────────────────────────────────────
        self.stdout.write("\n" + "─" * 55)
        self.stdout.write(
            self.style.SUCCESS(f"✅ Tạo mới : {so_tao_moi} bài báo")
        )
        if so_bo_qua:
            self.stdout.write(f"   Bỏ qua   : {so_bo_qua} bài báo (đã tồn tại)")
        self.stdout.write(
            f"   Tổng cộng: {BaiBaoNCKH.objects.count()} bài báo trong DB"
        )
        self.stdout.write(
            "\n   Test ngay: GET http://localhost:8000/api/bai-bao/"
        )
        self.stdout.write("═" * 55 + "\n")