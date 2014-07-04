.. _vagrantsetup:

===========================
Vagrant Setup (Recommended)
===========================

After you get everything from :ref:`devsystemrequirements`, clone the git
repository and cd into it and create a file named settings_local.py with
the following content::

    DEBUG = True
    SECRET_KEY = "<some random string here>"

Save the file. In the project directory, type::

    $ vagrant up

Wait about 10 minutes while everything setup. You must have a working
internet connection.

You should see that all tests has passed. After this point, you can do
``vagrant ssh`` to get into the vagrant box. After that you should be placed
in a directory called /projecto. This is synced with your project dir via NFS.

Some convenience aliases has been set in the VM. Type ``s`` to start the dev
server and ``t`` to server side unittest.

Note that unittests will fail if ``DEBUG = False``. This is an issue currently
under investigation.

The ip of the box is set to 192.168.33.10. ``dev.getprojecto.ml`` has an A
record pointing to it. Going to http://dev.getproject.ml after you start the
server should allow you to access your local instance of projecto.

Windows Notes
-------------

(This may or may not be broken with the new files feature).

The lack of NFS on Windows is a big deal. So what we can do is redirect the
``DATABASE_FOLDER`` to be something different. The recommended place is your
home directory, which is /home/vagrant.

So, create a database folder in /home/vagrant::

    $ mkdir /home/vagrant/databases

Your settings_local.py file should have the extra line::

    DATABASES_FOLDER = "/home/vagrant/databases"

After this, your unittests should pass. You can also remove the databases folder
inside your directory.
