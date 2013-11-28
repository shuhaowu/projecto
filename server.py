from __future__ import absolute_import

from projecto import app
from settings import DEBUG, HOST, PORT

if __name__ == "__main__":
  if DEBUG:
    app.run(debug=True, host="", port=PORT)
  else:
    from gevent.wsgi import WSGIServer
    from werkzeug.contrib.fixers import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app)
    server = WSGIServer((HOST, PORT), app)
    server.serve_forever()
