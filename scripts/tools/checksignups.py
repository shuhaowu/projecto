import riak
import settings

if __name__ == "__main__":
  rc = riak.RiakClient(protocol="pbc", nodes=settings.RIAK_NODES)
  signup_bucket = rc.bucket(settings.DATABASES["signups"])

  l = 0
  for email in signup_bucket.stream_keys():
    print email
    l += 1

  print "Total:", l, "signups"
