.. _merging:

============
Merging Code
============

Merging code into Projecto's master is not a very complicated process.
You will need to use Github_, so make sure you have an account there first.

After you get an account, fork the projecto repository_.

.. _Github: https://github.com
.. _repository: https://github.com/shuhaowu/projecto

Git Workflow
------------

When authoring a patch for a feature or to fix a bug, use git's branching
feature. Always branch out to a branch with the issue number in it. Let's say
if you're working on issue 42 and it is about refactoring the feed controller,
before you start your patch, you should branch out like this::

    $ git branch refactor-feed-42

Of course, the name of the branch is up to you. Try to reference the issue
number in the branch name.

Next, you should author your patch. Try to have some descriptive commit
messages.

If master receives additional commits after you started your patch, have no
fear! If master's change is relatively insignificant, just keep going.
Otherwise you should rebase your changes against master::

    $ git fetch upstream # Assuming that upstream points to the projecto repo.
    $ git rebase upstream/master

Once you're done your patch, commit and push it to your own repository::

    $ git commit # commits
    $ git push origin refactor-feed-42 # or other branch names

Now go to the Github UI and hit pull request. Have a descriptive title and some
descriptions of what this patch does and why it is useful. Put
"Fixes #<issuenumber>" (example: Fixes #42) at the end of the pull request
description.

Wait for review and once you get a thumbs up, your code will be merged.

Unittests
---------

Testing is a very important part of Projecto. Not everything was tested when
the project first began. However, all **new** code must have unittests unless
it is an extremely trivial change (typo, or things that doesn't affect the core
logic).

Additionally, all unittests must pass for code to be merged. So please run all
tests.

The clientside tests runs by typing the following command on **host**
machine::

    $ karma start karma.config.js

This will test the clientside code in both Chrome, Firefox, and PhantomJS.

The server side tests runs by typing the following command on the
**Vagrant box**::

    $ t
