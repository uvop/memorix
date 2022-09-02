# /bin/sh
(cd ../../../codegen && yarn cli codegen ../clients/redis/python/memorix_client_redis/example-schema.memorix -l python)
(cd ../../../codegen && yarn cli codegen ../clients/redis/python/tests/example-schema.memorix)
