poetry install

poetry show -v>.tmp_poetry
export pythonPath=`grep -r "virtualenv" .tmp_poetry | sed 's/.*: //1'`
rm .tmp_poetry
cat .vscode/settings_template.json | sed "s|\"python.defaultInterpreterPath\": \".*\"|\"python.defaultInterpreterPath\": \"$pythonPath/bin/python\"|1" > .vscode/settings.json
