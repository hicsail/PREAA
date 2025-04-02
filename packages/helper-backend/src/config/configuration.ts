export default () => ({
  mongo: {
    uri: process.env.HELPER_MONGO_URI || 'mongodb://127.0.0.1:27017/custom-helper'
  },
  litellm: {
    uri: process.env.LITE_LLM_BASE_URL || 'http://localhost:4000'
  }
});
