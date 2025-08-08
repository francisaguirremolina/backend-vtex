import mongoose from 'mongoose';
import User from '../../../models/User';

describe('User Model', () => {
	afterAll(async () => {
		await mongoose.disconnect();
	});
	// Test the encrypt method
	describe('Encription', () => {
		test('Encryption / decryption methods should work', async () => {
			const user = new User({ vtexKey: 'vtexKey', vtexUrl: 'vtexUrl' });

			user.password = 'my-secret-password';

			expect(user.password).toMatch(/my-secret-password/);
		});
	});
});
