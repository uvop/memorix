nvm use

yarn

for appPath in ./docs ./cli ./clients/js ./clients/python ./app/backend ./app/frontend; do
    if [ -f $appPath/install.sh ]; then
        echo "running install for $appPath"
        (cd $appPath && ./install.sh)
    fi
done