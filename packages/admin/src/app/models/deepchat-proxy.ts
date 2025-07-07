import mongoose from "mongoose";

export interface DeepchatProxies extends mongoose.Document {
  modelName: string;
  url: string;
  apiKey: string;
}

const DeepchatProxySchema = new mongoose.Schema<DeepchatProxies>({
  modelName: { type: String, required: [true, 'Please specify the name of the model'] },
  url: { type: String, required: [true, 'Please specify the endpoint'] },
  apiKey: { type: String, required: [true, 'Please specify the API key to use'] }
});

