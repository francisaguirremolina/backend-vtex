module.exports = {
	testEnvironment: 'node',
	testEnvironmentOptions: {
		NODE_ENV: 'test'
	},
	restoreMocks: true,
	coveragePathIgnorePatterns: [
		'node_modules',
		'dist/config',
		'dist/tests',
		'dist/app.js',
		'scr/interfaces',
		'src/config',
		'src/docs',
		'src/lib',
		'src/declaration.d.ts',
		'src/custom.d.ts',
		'src/models',
		'src/routes',
		'src/tests',
		'src/utils',
		'src/declaration',
		'src/custom',
		'src/app',
		'src/index',
		'src/validations',
		'src/middlewares',
		'src/services',
		'src/controllers'
	],
	coverageReporters: ['text', 'lcov', 'clover', 'html'],
	modulePathIgnorePatterns: ['dist', 'src/tests'],
	globals: {
		'ts-jest': {
			diagnostics: false
		}
	},
	transform: { '\\.ts$': ['ts-jest'] }
};
