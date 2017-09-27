import { Core } from "../core";
import { EventBus } from "../eventBus";

export class DiscordChannels {

  constructor() {
    EventBus.on("sendMessage", this.sendMessage);

    const core = Core();

    core.getClient();
  }

  sendMessage(data) {
    data.caller.channel.send(data.msg);
  }
}