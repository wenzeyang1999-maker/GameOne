# 本地服务器：每次都返回最新文件，禁止浏览器缓存（Safari 缓存 js 会导致读到旧代码）
import http.server, socketserver

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', 8000), NoCache) as httpd:
    print('http://localhost:8000/school.html')
    httpd.serve_forever()
