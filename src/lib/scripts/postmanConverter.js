// Require Package
import { Logger } from 'conexa-core-server';
import postmanToOpenApi from 'postman-to-openapi';

// Postman Collection Path
const postmanCollection = 'src/docs/postman-collection.json';
// Output OpenAPI Path
const outputFile = 'src/docs/openapi.json';

const convertPostmanToOpenApi = async () => {
	try {
		await postmanToOpenApi(postmanCollection, outputFile, {
			defaultTag: 'General',
			outputFormat: 'json'
		});

		Logger.info('OpenAPI Docs generated successfully!');
	} catch (err) {
		Logger.error(err.message);
	}
};

convertPostmanToOpenApi();
