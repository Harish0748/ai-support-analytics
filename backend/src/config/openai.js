const OpenAI = require('openai');

// Lazy singleton — instantiated on first use so a missing key at import time
// doesn't crash the whole server before the .env is loaded.
let _client = null;

const getClient = () => {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Add it to your backend/.env file.');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

// Transparent proxy — existing code using openai.chat.completions.create() keeps working
const openai = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  },
});

module.exports = openai;
