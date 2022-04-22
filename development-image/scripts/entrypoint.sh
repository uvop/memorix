#!/bin/sh
$DOCKER_SCRIPTS/entrypoint-ssh.sh

sudo service postgresql start

sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'uv';"

$HOME/redis-6.2.4/src/redis-server --daemonize yes

tail -f /dev/null