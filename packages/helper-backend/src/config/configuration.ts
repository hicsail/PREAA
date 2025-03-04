export default () => ({
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/custom-helper'
  }
});
