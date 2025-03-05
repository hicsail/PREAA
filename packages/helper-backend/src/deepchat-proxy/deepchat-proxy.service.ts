import { Injectable } from "@nestjs/common";
import { DeepchatProxy, DeepchatProxyDocument } from "./deepchat-proxy.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class DeepchatProxyService {
  constructor(@InjectModel(DeepchatProxy.name) private readonly deepChatProxyModel: Model<DeepchatProxyDocument>) {}

  async get(id: string): Promise<DeepchatProxy | null> {
    return this.deepChatProxyModel.findOne({ _id: id });
  }

  async getAll(): Promise<DeepchatProxy[]> {
    return this.deepChatProxyModel.find();
  }

  async create(mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return await this.deepChatProxyModel.create(mapping);
  }

  async update(mapping: DeepchatProxy): Promise<DeepchatProxy | null> {
    return await this.deepChatProxyModel.findOneAndUpdate({ model: mapping.model }, mapping, {
      new: true,
      upsert: true,
    });
  }

  async delete(model: string): Promise<void> {
    await this.deepChatProxyModel.deleteOne({ model });
  }

  async proxyRequest(model: string, url: string, apiKey: string, body: any): Promise<any> {
    // reshape the body
    body.messages.forEach((message: any) => {
      message.content = message.text;
    });
    body.model = model;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
    });

    // reshape the response
    const responseJson = await response.json();
    responseJson.text = responseJson.choices[0].message.content;

    return responseJson;
  }

}