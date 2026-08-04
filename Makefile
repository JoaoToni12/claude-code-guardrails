.PHONY: check demo test settings

check:
	npm run check

test:
	npm test

demo:
	npm run demo

settings:
	npm run render-settings -- --write
