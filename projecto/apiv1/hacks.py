# Flask does not allow static_url_path without appending it to url_prefix.
# To resolve this..

from flask import Blueprint as FlaskBlueprint

class Blueprint(FlaskBlueprint):

  # Basically a straight copy from flask.
  def register(self, app, options, first_registration=False):
    self._got_registered_once = True
    state = self.make_setup_state(app, options, first_registration)
    if self.has_static_folder:
      # Let the hack begin
      # gotta trick state into thinking there is not url prefix
      _tmp = state.url_prefix
      state.url_prefix = None
      state.add_url_rule(self.static_url_path + '/<path:filename>',
                         view_func=self.send_static_file,
                         endpoint='static')
      state.url_prefix = _tmp

    for deferred in self.deferred_functions:
      deferred(state)