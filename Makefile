APP_FILE=server.pyz
TMP_DIR=.tmp
BUILD_DIR=build
PACKAGES_DIR=site-packages
EXCLUDE_FILES=".git/*" ".venv/*" ".env" ".mypy_cache" ".vscode/*" "*.pyz" ".mypy_cache/*" "./__pycache__/*" "build/*"


.PHONY: help
help:
	@echo "Usage: make [build|clean|run|dev]"
	@echo "	build           : creates the application bundle"
	@echo "	clean           : removes all traces of build artifacts"
	@echo "	run             : runs built application"
	@echo "	dev             : runs the application in a development mode"


.venv/bin/activate:
	python3 -m venv .venv
	source .venv/bin/activate; \
	pip install -r local.txt;

.PHONY: build
build:
	@rm -rf $(BUILD_DIR)/$(APP_FILE) $(TMP_DIR)
	@mkdir -p $(BUILD_DIR) $(TMP_DIR)/
	@cp -r *.py public server $(TMP_DIR)/

	@pip install --compile -q --disable-pip-version-check --prefer-binary --no-input -r requirements.txt --target $(TMP_DIR)/$(PACKAGES_DIR);

	@cd $(TMP_DIR)/; \
		zip -9q -x $(EXCLUDE_FILES) -r ../$(BUILD_DIR)/$(APP_FILE)$(TMP_DIR) . ;

	@sh -c 'echo "#!/usr/bin/env python3" > ./$(BUILD_DIR)/$(APP_FILE)'
	@sh -c 'cat ./$(BUILD_DIR)/$(APP_FILE)$(TMP_DIR) >> ./$(BUILD_DIR)/$(APP_FILE)'
	@chmod +x ./$(BUILD_DIR)/$(APP_FILE)
	@rm -rf ./$(BUILD_DIR)/$(APP_FILE)$(TMP_DIR)
	@echo "Done"
	@unzip -l ./$(BUILD_DIR)/$(APP_FILE) | grep -v "site-packages"
	@echo
	@echo "Run find using"
	@echo "   python3 ./$(BUILD_DIR)/$(APP_FILE)"


.PHONY: run
run:
	/usr/bin/env python3 $(BUILD_DIR)/$(APP_FILE)


.PHONY: dev
dev: .venv/bin/activate
	source .venv/bin/activate; \
	uvicorn server.server:app --host 127.0.0.1 --port 8000 --reload


.PHONY: clean
clean:
	rm -rf $(TMP_DIR) $(BUILD_DIR) .mypy_cache
