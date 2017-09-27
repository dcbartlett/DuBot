import { Core } from "../core";
import { EventBus } from "../eventBus";

export class CommandProcessor {
  private registeredCommands: Object = {};
  private config: { prefix: string } = { prefix: "."};

  constructor() {

    EventBus.on("register", this.register.bind(this));

    const core = Core();

    core.getClient().on("message", (msg) => {
      if (msg.content.startsWith(this.config.prefix)) {
        if (this.registeredCommands.hasOwnProperty(msg.content.replace(this.config.prefix, "").split(" ")[0])) {
          this.registeredCommands[msg.content.replace(this.config.prefix, "").split(" ")[0]](msg);
        }
      }
    });
  }

  register(module) {
    if (module.target === "CommandProcessor") {
      console.log(`${module.name} just registered with CommandProcessor.`);
      Object.keys(module.commands).forEach((command) => {
        this.registeredCommands[command] = module.commands[command];
      });
    }
  }
}