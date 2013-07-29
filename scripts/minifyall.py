import subprocess
from settings import get_all_js_uncompiled, MINIFIED_JS_PATH, get_all_partials, MINIFIED_PARTIALS_PATH

def minify_partials(*paths):
  inline_partial = """
<script id="{path}" type="text/ng-template">
{content}
</script>
"""
  s = ""
  for path in paths:
    with open(path) as f:
      s += inline_partial.format(path="/" + path, content=f.read())

  return s

if __name__ == "__main__":
  print "Minifying JavaScript"
  paths = [js[1:] for js in get_all_js_uncompiled()]
  with open(MINIFIED_JS_PATH[1:], "w") as f:
    f.write(subprocess.check_output(["uglifyjs"] + paths + ["-m", "-c"]))

  print "JavaScript minified to {}".format(MINIFIED_JS_PATH[1:])

  print "Minifying partials"
  paths = [partial[1:] for partial in get_all_partials()]
  with open(MINIFIED_PARTIALS_PATH, "w") as f:
    f.write(minify_partials(*paths))

  print "Partials minified to {}".format(MINIFIED_PARTIALS_PATH)



