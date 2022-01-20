# Bundle Python Application Using Zip

This is a small proof-of-concept (PoC) setup for packaging application as a single Python executable ZIP archive.

The idea is that the archive includes all (*most*) of the dependencies of the application and could be easily distributed to other interested parties.

A minimal [FastAPI](https://fastapi.tiangolo.com/) setup is used to simulate an application with a number of dependencies, like [Uvicorn server](https://www.uvicorn.org/).

Python includes an awesome utility module [zipapp](https://docs.python.org/3/library/zipapp.html) for packaging the application, however this example uses [the standard zip command line utility](https://linux.die.net/man/1/zip) to bundle up the application. This is because the PoC uses a custom [`__main__.py`](__main__.py) file which updates `sys.path` list, because the dependencies are placed in a dedicated directory `./site-packages` that are not part of the standard locations where Python looks for modules.

## Application Packaging

```bash
# create a temporary locations for bundling the application
mkdir -p .tmp/ build

# copy the application code to the temporary location
cp -r *.py public server .tmp/

# install required dependencies to a dedicated directory
pip install -r requirements.txt --target .tmp/site-packages


# bundle up the application with dependencies
cd .tmp/
zip -r9 ../build/server.pyz .
cd ..

# run the application
python3 ./build/server.pyz

# make archive executable on its own
mv ./build/server.pyz ./build/server.pyz.tmp
echo '#!/usr/bin/env python3' > ./build/server.pyz
cat ./build/server.pyz.tmp >> ./build/server.pyz
rm ./build/server.pyz.tmp
chmod +x ./build/server.pyz

# start the application
./build/server.pyz


# the service could also be started using standard Uvicorn command
# Python path needs to be updated to point to the bundled application internals
PYTHONPATH="./build/server.pyz/site-packages:./build/server.pyz" python -m uvicorn server:app --host localhost --port 4000


# most of the actions could be performed using Make utility
make
Usage: make [build|clean|run|dev]
        build           : creates the application bundle
        clean           : removes all traces of build artifacts
        run             : runs built application
        dev             : runs the application in development mode

```


## References

- [Python zipapp](https://docs.python.org/3/library/zipapp.html)
- [Python's zipapp: Build Executable Zip Applications](https://realpython.com/python-zipapp/)
- [An Overview of Packaging for Python](https://packaging.python.org/en/latest/overview/#bringing-your-own-python-executable)
- [shiv - command line utility for building fully self-contained Python zipapps](https://github.com/linkedin/shiv)
