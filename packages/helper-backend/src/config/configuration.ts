export default () => ({
  mongo: {
    uri: process.env.HELPER_MONGO_URI || 'mongodb://127.0.0.1:27017/custom-helper'
  }
});
