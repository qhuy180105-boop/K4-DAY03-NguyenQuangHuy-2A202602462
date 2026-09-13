"""
🌐 REACT AGENT DEMO WEB SERVER
Server chạy ứng dụng Web Demo trực quan hóa ReAct Agent cho buổi báo cáo / demo.
"""

import os
import sys
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Thêm thư mục gốc và src vào sys.path để import các module của bài lab
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_DIR = os.path.join(BASE_DIR, "src")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from src.mcp_server import MCPAcademicServer
from src.providers import get_llm_provider
from src.app import run_react_agent
from src.tools import TOOLS_SCHEMA

# Singleton instances
mcp_server = MCPAcademicServer()
provider = get_llm_provider()

SESSION_WATERFALL_LOGS = []

def get_waterfall_logs():
    global SESSION_WATERFALL_LOGS
    waterfall_path = os.path.join(BASE_DIR, "docs", "trace_waterfall.json")
    if not SESSION_WATERFALL_LOGS and os.path.exists(waterfall_path):
        try:
            with open(waterfall_path, "r", encoding="utf-8") as f:
                SESSION_WATERFALL_LOGS = json.load(f)
        except Exception:
            SESSION_WATERFALL_LOGS = []
    if not isinstance(SESSION_WATERFALL_LOGS, list):
        SESSION_WATERFALL_LOGS = []
    return SESSION_WATERFALL_LOGS

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

class DemoRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def log_message(self, format, *args):
        sys.stdout.write(f"🌐 [DEMO SERVER] {self.address_string()} - {format % args}\n")

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/api/info":
            info_data = {
                "student": {
                    "name": "Nguyễn Quang Huy",
                    "id": "2A202602462",
                    "course": "VINUNI AI COURSE - DAY 03 LAB"
                },
                "topic": {
                    "name": "Trợ lý Học vụ & Tra cứu Lịch thi VinUni",
                    "category": "Giáo dục & Đào tạo (Education & Academics)",
                    "description": "Tra cứu hồ sơ học vụ, điểm GPA, cố vấn học tập và tự động đặt lịch hẹn tư vấn học vụ qua giao thức Model Context Protocol (MCP)."
                },
                "agentic_fit": {
                    "total_score": 17,
                    "max_score": 20,
                    "criteria": [
                        {
                            "title": "1. Multi-step Reasoning",
                            "score": 4,
                            "desc": "Chia nhỏ nhiều bước suy luận: Tra cứu sinh viên -> Tìm tên cố vấn -> Đặt lịch tư vấn."
                        },
                        {
                            "title": "2. Tool Interaction",
                            "score": 5,
                            "desc": "Tương tác trực tiếp với MCP Server để query DB học vụ (academic_query) và đặt lịch (schedule_appointment)."
                        },
                        {
                            "title": "3. Dynamic Decision",
                            "score": 4,
                            "desc": "Kết quả quan sát (Observation) từ bước tra cứu quyết định tham số đầu vào cho bước đặt lịch hẹn tiếp theo."
                        },
                        {
                            "title": "4. Long Horizon Goal",
                            "score": 4,
                            "desc": "Duy trì ngữ cảnh và mục tiêu hoàn thành buổi đặt lịch xuyên suốt qua nhiều lượt xử lý ReAct Loop."
                        }
                    ]
                },
                "architecture": {
                    "components": [
                        {"name": "Client Web UI", "role": "Giao diện Dashboard & Chatbot tương tác cho Người dùng/Sinh viên"},
                        {"name": "ReAct Agent Core (src/app.py)", "role": "Vòng lặp Thought -> Action -> Observation điều phối suy luận"},
                        {"name": "Multi-Provider LLM Adapter (src/providers.py)", "role": "Kết nối API Groq/OpenAI/Gemini (model: qwen/qwen3.8-27b)"},
                        {"name": "MCP Server (src/mcp_server.py)", "role": "Giao thức Model Context Protocol quản lý Tool Specs & Dispatcher"},
                        {"name": "Execution Layer & Mock DB (src/tools.py)", "role": "Thực thi công cụ tra cứu học vụ và lưu vết đặt lịch"}
                    ]
                },
                "tools": TOOLS_SCHEMA,
                "provider": {
                    "name": provider.__class__.__name__,
                    "model": getattr(provider, "model_name", "N/A")
                }
            }
            return self._send_json(info_data)

        elif path == "/api/test-cases":
            test_cases_path = os.path.join(BASE_DIR, "config", "test_cases.json")
            if os.path.exists(test_cases_path):
                with open(test_cases_path, "r", encoding="utf-8") as f:
                    test_cases = json.load(f)
                return self._send_json(test_cases)
            else:
                return self._send_json([], status_code=404)

        elif path == "/api/waterfall":
            logs = get_waterfall_logs()
            return self._send_json(logs)

        else:
            return super().do_GET()

    def do_POST(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == "/api/chat":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                query = payload.get("query", "").strip()

                if not query:
                    return self._send_json({"error": "Query cannot be empty"}, status_code=400)

                start_t = time.time()
                # Run ReAct Agent loop
                trace_logs = run_react_agent(query, provider, mcp_server)
                total_latency_ms = round((time.time() - start_t) * 1000, 2)

                # Extract final answer
                final_answer = ""
                if trace_logs:
                    last_log = trace_logs[-1]
                    if last_log.get("action_type") == "FINAL_ANSWER":
                        final_answer = last_log.get("output", "")
                    else:
                        final_answer = f"Đã hoàn tất thực thi qua công cụ '{last_log.get('tool_name')}'."

                # Accumulate trace logs both in memory and on disk
                logs = get_waterfall_logs()
                logs.extend(trace_logs)

                waterfall_path = os.path.join(BASE_DIR, "docs", "trace_waterfall.json")
                try:
                    with open(waterfall_path, "w", encoding="utf-8") as f:
                        json.dump(logs, f, ensure_ascii=False, indent=2)
                except Exception as ex:
                    sys.stderr.write(f"⚠️ Error saving trace waterfall: {ex}\n")

                return self._send_json({
                    "status": "SUCCESS",
                    "query": query,
                    "final_answer": final_answer,
                    "trace_logs": trace_logs,
                    "total_latency_ms": total_latency_ms
                })

            except Exception as e:
                return self._send_json({"status": "ERROR", "error": str(e)}, status_code=500)
        else:
            self.send_error(404, "Endpoint Not Found")

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, DemoRequestHandler)
    print("==========================================================")
    print("🚀 VINUNI AI COURSE - REACT AGENT WEB DEMO APP SERVER")
    print("==========================================================")
    print(f"👤 Học viên: Nguyễn Quang Huy (MSSV: 2A202602462)")
    print(f"📌 Đề tài: Trợ lý Học vụ & Tra cứu Lịch thi VinUni")
    print(f"🌐 Server running at: http://localhost:{port}")
    print("💡 Mở trình duyệt và truy cập liên kết trên để xem giao diện Presentation & Live Demo!")
    print("==========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Đã dừng Web Server.")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run_server(port)
