import { connect, set } from 'mongoose';
import { NODE_ENV, DB_HOST, DB_PORT, DB_DATABASE } from '@config';

export const dbConnection = async () => {
  try {
    const dbConfig = {
      url: '',
    };
    if (NODE_ENV === 'production') {
      dbConfig.url = `mongodb+srv://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
    } else {
      dbConfig.url = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
    }

    if (NODE_ENV !== 'production') {
      set('debug', true);
    }

    await connect(dbConfig.url);
  } catch (error) {
    console.log('Error connecting to database:', error);
  }
};
