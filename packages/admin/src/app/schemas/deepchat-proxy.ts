import mongoose from "mongoose";

export interface DeepchatProxies extends mongoose.Document {
  modelName: string;
  apiKey: string;
}

const DeepchatProxySchema = new mongoose.Schema<DeepchatProxies>({
  modelName: { type: String, required: [true, 'Please specify the name of the model'] },
  apiKey: { type: String, required: [true, 'Please specify the API key to use'] }
});

export default mongoose.models.DeepchatProxy || mongoose.model<DeepchatProxies>("DeepchatProxy", DeepchatProxySchema);
