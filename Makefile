VERSION=1git`git rev-parse HEAD | cut -c1-8`
TARGET=packaging/projecto_$(VERSION).orig.tar
GZIPPEDTARGET=packaging/projecto_$(VERSION).orig.tar
PREFIX=projecto

minify:
	PYTHONPATH=. python scripts/minifyall.py

release-tar: minify
	git archive -v --worktree-attributes --prefix=$(PREFIX)/ --format tar HEAD > $(TARGET)
	tar --append --transform 's,^,/$(PREFIX)/,' --file=$(TARGET) all_partials.html
	tar --append --transform 's,^,/$(PREFIX)/,' --file=$(TARGET) static/js/app.js
	tar --append --transform 's,^,/$(PREFIX)/,' --file=$(TARGET) serversettings.py
	git rev-parse HEAD > commit.txt
	tar --append --transform 's,^,/$(PREFIX)/,' --file=$(TARGET) commit.txt
	rm commit.txt
	gzip $(TARGET)
