import os
import settings

for dbname in settings.DATABASES.keys():
  settings.DATABASES[dbname] = (settings.DATABASES[dbname][0] + "_test", settings.DATABASES[dbname][1] + "_test")
  try:
    os.unlink(settings.DATABASES[dbname][0])
    os.unlink(settings.DATABASES[dbname][1])
  except OSError:
    # Already deleted
    pass
