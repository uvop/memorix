for appPath in ./codegen ./clients/js; do
    if [ -f $appPath/install.sh ]; then
        echo "running install for $appPath"
        (cd $appPath && ./install.sh)
    fi
done