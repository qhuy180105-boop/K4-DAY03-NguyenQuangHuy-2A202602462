# 🌐 VINUNI AI COURSE — REACT AGENT WEB DEMO APP

Ứng dụng Web Demo trực quan hóa ReAct Agent (MCP-Enhanced) được xây dựng bám sát **5 Mục yêu cầu trình bày trên bảng (Dudumi Requirements)** dành cho buổi báo cáo và bảo vệ bài lab.

> **Học viên:** Nguyễn Quang Huy (MSSV: 2A202602462)  
> **Chủ đề:** Trợ lý Học vụ & Tra cứu Lịch thi VinUni  

---

## ⚡ 1. QUICKSTART — KHỞI CHẠY WEB DEMO APP (1 LỆNH DUY NHẤT)

Mở Terminal tại thư mục gốc dự án và thực thi lệnh sau:

```bash
python demo/server.py
```

Màn hình Terminal sẽ hiển thị:
```text
==========================================================
🚀 VINUNI AI COURSE - REACT AGENT WEB DEMO APP SERVER
==========================================================
👤 Học viên: Nguyễn Quang Huy (MSSV: 2A202602462)
📌 Đề tài: Trợ lý Học vụ & Tra cứu Lịch thi VinUni
🌐 Server running at: http://localhost:8000
💡 Mở trình duyệt và truy cập liên kết trên để xem giao diện Presentation & Live Demo!
==========================================================
```

Mở trình duyệt bất kỳ (Chrome / Edge / Firefox) và truy cập đường dẫn:
👉 **`http://localhost:8000`**

---

## 📋 2. NỘI DUNG GIAO DIỆN WEB DEMO BÁM SÁT BẢNG TRÌNH BÀY

Giao diện SPA (Single Page Application) thiết kế theo 3 Tab bám sát 5 yêu cầu trên bảng:

1. **Tab 1: 📌 Đề tài & Agentic Fit Scorecard** (Đáp ứng Mục 1 & Mục 2):
   - Hiển thị tên Đề tài, bối cảnh thực tế và lý do lựa chọn.
   - Thể hiện thang điểm **17 / 20 điểm Agentic Fit** với 4 thanh tiến trình visual cho 4 tiêu chí.

2. **Tab 2: 🏗️ Biểu đồ Kiến trúc & Tools Registry** (Đáp ứng Mục 3 & Mục 4):
   - Biểu đồ luồng tương tác: `Client Web UI` $\leftrightarrow$ `ReAct Core` $\leftrightarrow$ `Multi-Provider LLM` $\leftrightarrow$ `MCP Server` $\leftrightarrow$ `Backend Tools`.
   - Danh sách công cụ công bố qua MCP: `academic_query` & `schedule_appointment` kèm tham số JSON Schema.

3. **Tab 3: 💬 Live Demo & ReAct Trace Log** (Đáp ứng Mục 5):
   - Khung Chatbot trò chuyện trực tiếp kèm thanh công cụ **Bộ 5 Test Cases Thử Nghiệm**.
   - Bảng vết thực thi hiển thị thời gian thực luồng ReAct (`Thought` 🧠 $\rightarrow$ `Action Proposed` 🛠️ $\rightarrow$ `Observation từ MCP Server` 👁️ $\rightarrow$ `Final Answer` 🏁).
   - Trình duyệt tệp vết Waterfall JSON Log kèm chỉ số độ trễ `latency_ms`.
