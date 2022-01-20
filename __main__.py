import pathlib
import re
import sys
import webbrowser

# append an additional location where to look for Python modules
sys.path.append(f"{pathlib.Path(__file__).parent.resolve()}/site-packages")


from uvicorn.main import main 

if __name__ == "__main__":
    sys.argv[0] = re.sub(r"(-script\.pyw|\.exe)?$", "", sys.argv[0])
    webbrowser.open_new_tab("http://localhost:8000")
    sys.exit(main(["server:app"]))
