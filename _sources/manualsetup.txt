.. _manualsetup:

==============================
Manual Setup (NOT RECOMMENDED)
==============================

**Warning: This is not recommended. You should be using :ref:`vagrantsetup` 
instead. The instructions here may be outdated, break your setup, and so forth.
Basically, by following this, you voided the warrenty. This is here for 
educational purposes.**

This project has a some weird dependencies (really.. all non-trivial apps have
weird dependencies).

Before we can do anything, we must get a virtual environment setup. So please
do that. Once that's done, we need to install leveldb (for now, we will probably
switch to `levelupdb <https://github.com/shuhaowu/levelupdb>`_ or Riak later).

Installing leveldb is slightly tricky. So follow the following commands (make
sure your virtual env is activated!)::

    svn checkout http://py-leveldb.googlecode.com/svn/trunk/ py-leveldb-read-only
    cd py-leveldb-read-only
    ./compile_leveldb.sh
    python setup.py build
    python setup.py install

This _should_ in theory install leveldb. To make sure, open up a python shell
and do the following::

    $ python
    Python 2.7.3 (default, Aug  1 2012, 05:14:39)
    [GCC 4.6.3] on linux2
    Type "help", "copyright", "credits" or "license" for more information.
    >>> from leveldb import LevelDB
    >>>

If you get exactly that, you should be okay and can skip this section.
If python complains with `ImportError`. There is an issue. Luckily we can
try diagonising it. Still in your python shell::

    >>> import leveldb
    >>> dir(leveldb)
    ['__doc__', '__file__', '__name__', '__package__']

If you get something like this. I would go back and try to go back and try
to do the ``./compile_leveldb.sh; python setup.py build`` step again.
If python complains about leveldb not being available, check if your virtualenv
is active when you did ``python setup.py install``.

If you still have trouble, try doing ``pip install leveldb``. And if you still
have trouble, contact one of the developers.

After install leveldb, you can use pip to install the rest via::

    $ pip install -r requirements.txt

This should take a little bit of time but should work without issues.

We need to now create a database folder::

    $ mkdir databases

Lastly, we need a settings file. In the project root::

    $ touch settings_local.py

This file should have roughly this content::

    DEBUG = True

    SECRET_KEY = "{generate a random string please :)}"

Without this, you will not be able to run unittests.

You can also override anything in settings.py here. However, you must have
``SECRET_KEY`` set.

To start the server, run::

    $ python server.py
    ==================================================================
    WARNING: BCRYPT NOT AVAILABLE. DO NOT USE IN PRODUCTION WITHOUT IT
    ==================================================================
     * Running on http://localhost:8800/
     * Restarting with reloader
    ==================================================================
    WARNING: BCRYPT NOT AVAILABLE. DO NOT USE IN PRODUCTION WITHOUT IT
    ==================================================================

Ignore the warning. We don't use store passwords so it is okay.

Navigate to http://localhost:8800 to check out the site.

