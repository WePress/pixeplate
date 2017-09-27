app:
	node_modules/.bin/electron-packager . pixe\(p\)late --arch x64 --platform darwin

deps:
	npm install

run:
	npx electron .
