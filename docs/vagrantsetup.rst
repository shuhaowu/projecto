.. _vagrantsetup:

===========================
Vagrant Setup (Recommended)
===========================

After you get everything from :ref:`devsystemrequirements`, clone the git
repository and cd into it and type::

    $ vagrant up

Wait about 10 minutes while everything setup. You must have a working 
internet connection. 

You should see that all tests has passed. After this point, you can do 
``vagrant ssh`` to get into the vagrant box. After that you should be placed 
in a directory called /projecto. This is synced with your project dir via NFS.

Some convenience aliases has been set in the VM. Type ``s`` to start the dev 
server and ``t`` to unittest.

The ip of the box is set to 192.168.33.10. Going to http://192.168.33.10:8800 
on your machine should get to projecto.

Another convenience thing that was added is an nginx reverse proxy. You can add
the entry::

    192.168.33.10 projecto

into your /etc/hosts file and go to http://projecto to get to the projecto dev
server (after it is booted, of course)

