nvm use

yarn

for appPath in ./codegen ./clients/js ./app/backend ./app/frontend; do
    if [ -f $appPath/install.sh ]; then
        echo "running install for $appPath"
        (cd $appPath && ./install.sh)
    fi
done