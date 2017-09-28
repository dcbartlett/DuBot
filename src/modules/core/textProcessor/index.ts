import { Core } from "../core";
import { EventBus } from "../../eventBus";

export class TextProcessor {
  private registeredModules: Array<Function> = [];

  constructor() {

    EventBus.on("register", this.register.bind(this));

    const core = Core();

    core.getClient().on("message", (msg) => {
        this.registeredModules.forEach((module) => {
            module(msg);
        });
    });
  }

  register(module) {
    if (module.target === "TextProcessor") {
      console.log(`${module.name} just registered with TextProcessor.`);
      this.registeredModules.push(module.callback);
    }
  }
}