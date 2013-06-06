import os
import settings

# Cannot refactor with utils because importing utils will resulting in importing
# app
for dbname in settings.DATABASES.keys():
  settings.DATABASES[dbname] = (settings.DATABASES[dbname][0] + "_test", settings.DATABASES[dbname][1] + "_test")
  try:
    os.unlink(settings.DATABASES[dbname][0])
    os.unlink(settings.DATABASES[dbname][1])
  except OSError:
    # Already deleted
    pass

settings.TESTING = True
