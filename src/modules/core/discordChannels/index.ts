import { Core } from "../core";
import { EventBus } from "../../eventBus";

export class DiscordChannels {

  constructor() {
    EventBus.on("sendMessage", this.sendMessage);
    EventBus.on("replyMessage", this.replyMessage);
    EventBus.on("deleteMessage", this.deleteMessage);

    const core = Core();

    core.getClient();
  }

  sendMessage(data) {
    data.caller.channel.send(data.msg);
  }
  
  replyMessage(data) {
    data.caller.reply(data.msg);
  }
  
  deleteMessage(data) {
    if (!data.delay) {
      data.delay = 0;
    }
    data.caller.delete(parseInt(data.delay));
  }
}