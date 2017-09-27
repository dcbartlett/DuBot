import { Core } from "../core";
import { EventBus } from "../../eventBus";

export class MagicEightBall {
  public registration: Object = {};

  constructor() {

    this.registration = {
    name: "MagicEightBall",
    target: "CommandProcessor",
      commands: {
        "8ball": this.eightBall.bind(this),
        "eight_ball": this.eightBall.bind(this),
        "magic_ball": this.eightBall.bind(this),
        "shake": this.eightBall.bind(this)
      }
    };
    
    EventBus.emit("register", this.registration);
  }

  private eightBall(caller) {
    const message = caller.content.split(" ");
    message.shift();
    const response = [
      "It is certain",
      "It is decidedly so",
      "Without a doubt",
      "Yes definitely",
      "You may rely on it",
      "As I see it, yes",
      "Most likely",
      "Outlook good",
      "Yes",
      "Signs point to yes",
      "Reply hazy try again",
      "Ask again later",
      "Better not tell you now",
      "Cannot predict now",
      "Concentrate and ask again",
      "Don't count on it",
      "My reply is no",
      "My sources say no",
      "Outlook not so good",
      "Very doubtful"
    ];
    const randomNumber = this.getRandomInt(0, response.length);
    
    EventBus.emit("sendMessage", {caller: caller , msg: response[randomNumber] });
  }
  
  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min)) + min;
  }
}