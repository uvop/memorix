sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'memorix'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE memorix"

yarn install

yarn migrate:dev
yarn codegen