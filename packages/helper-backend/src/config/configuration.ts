export default () => ({
  mongo: {
    uri: process.env.HELPER_MONGO_URI || 'mongodb://127.0.0.1:27017/custom-helper'
  },
  google: {
    oauth: {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectURL: process.env.GOOGLE_OAUTH_REDIRECT_URL
    }
  }
});
