# /bin/sh
(cd ../../../cli && yarn cli codegen ../clients/redis/python/memorix_client_redis/example-schema.memorix python ../clients/redis/python/memorix_client_redis)
(cd ../../../cli && yarn cli codegen ../clients/redis/python/tests/example-schema.memorix python ../clients/redis/python/tests/)
