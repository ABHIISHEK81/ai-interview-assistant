const mongoose = require('mongoose');
const logger = require('./logger');

let memoryServerInstance = null;
let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
    });
  }

  isConnecting = true;

  const candidateUris = [
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_interviewer',
    'mongodb://127.0.0.1:27018/ai_interviewer',
  ];

  for (const uri of candidateUris) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
        maxPoolSize: 100,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      isConnecting = false;
      return conn;
    } catch (err) {
      // Try next URI or launch memory server
    }
  }

  // If neither 27017 nor 27018 is running, launch in-memory MongoDB on fixed port 27018 for zero-cost dev
  if (process.env.NODE_ENV !== 'production') {
    try {
      logger.info('Starting zero-lock in-memory MongoDB daemon on port 27018...');
      const { MongoMemoryServer } = require('mongodb-memory-server');

      try {
        memoryServerInstance = await MongoMemoryServer.create({
          instance: {
            port: 27018,
            dbName: 'ai_interviewer',
          },
        });
      } catch (portConflictErr) {
        // If port 27018 was recently taken by an orphaned mongod from previous nodemon cycle, use dynamic port
        logger.warn(`Port 27018 busy (${portConflictErr.message}), initializing dynamic port memory instance...`);
        memoryServerInstance = await MongoMemoryServer.create({
          instance: { dbName: 'ai_interviewer' },
        });
      }

      const memUri = memoryServerInstance.getUri();
      const conn = await mongoose.connect(memUri, {
        maxPoolSize: 100,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
      });
      logger.info(`In-Memory MongoDB Connected at ${memUri}`);
      isConnecting = false;

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Connection pool will auto-reconnect on next operation.');
      });

      return conn;
    } catch (memErr) {
      logger.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
      isConnecting = false;
      throw memErr;
    }
  } else {
    isConnecting = false;
    throw new Error('Could not connect to production MongoDB instance.');
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    logger.info('MongoDB disconnected.');
  } catch (err) {
    logger.error(`Error disconnecting MongoDB: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };

