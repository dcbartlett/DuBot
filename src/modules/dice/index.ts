import { Core } from "../core";
import { EventBus } from "../eventBus";

export class Dice {
  public registration: Object = {};

  constructor() {

    this.registration = {
    name: "Dice",
    target: "CommandProcessor",
      commands: {
        "roll": this.dice.bind(this),
        "dice": this.dice.bind(this),
        "loot": this.dice.bind(this),
        "random": this.dice.bind(this)
      }
    };
    
    EventBus.emit("register", this.registration);
  }

  private dice(caller) {
    let max;
    let min;
    const message = caller.content.split(" ");
    message.shift();
    max = message[0];
    if (message[1]) {
      min = message[0];
      max = message[1];
    }
    if (!max) {
      min = "1";
      max = "100";
    }
    
    const randomNumber = this.getRandomInt(parseInt(min), parseInt(max) + 1);
    EventBus.emit("sendMessage", {caller: caller , msg: `Rolling between ${min} and ${max}` });
    EventBus.emit("sendMessage", {caller: caller , msg: randomNumber });
  }
  
  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min)) + min;
  }
}