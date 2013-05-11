from __future__ import absolute_import

from projecto import app
from settings import DEBUG, DEPLOY_IP, DEPLOY_PORT

if __name__ == "__main__":
  if DEBUG:
    from projecto.models import close_connections
    app.run(debug=True, host="", port=DEPLOY_PORT, cleanup_func=close_connections)
  else:
    from gevent.wsgi import WSGIServer
    from werkzeug.contrib.fixers import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app)
    server = WSGIServer((DEPLOY_IP, DEPLOY_PORT), app)
    server.serve_forever()