process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-guddi-silai';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'mongodb://localhost:27017/guddi-silai-test';
process.env.BCRYPT_ROUNDS = '4';
process.env.PORT = '4000';
