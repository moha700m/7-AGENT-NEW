import http.server
import socketserver
import os
import json
from urllib.parse import urlparse

PORT = 3001

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            config = {
                "supabaseUrl": os.environ.get("SUPABASE_URL"),
                "supabaseAnonKey": os.environ.get("SUPABASE_ANON_KEY")
            }
            self.wfile.write(json.dumps(config).encode())
        else:
            # Check if file exists, if not serve index.html for non-file paths
            path = self.translate_path(self.path)
            if not os.path.exists(path) and '.' not in os.path.basename(path):
                self.path = '/index.html'
            return super().do_GET()

os.chdir('/home/ubuntu/project')
with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
