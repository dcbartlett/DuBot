import * as Discord from "discord.js";
import * as pm2 from "pm2";
import { EventBus } from "../eventBus";

class CoreClass {
  private options: Object = {};
  public registration: Object = {};
  private client: Discord.Client = new Discord.Client(this.options);

  constructor() {
    // Connect to discord and setup Session
    this.client.login("MjExNzU3NTkyODE5NjYyODQ4.DKuBMw.sNt2gej6sQ9zZZV0SojA-zSZeFk");

    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.username}!`);
      const channel = this.client.channels.get("149195002831044609") as Discord.VoiceChannel;
          
      channel.join().catch(console.error);

      this.registration = {
        name: "Core",
        target: "CommandProcessor",
        commands: {
          restart: this.restart.bind(this)
        }
      };
  
      EventBus.emit("register", this.registration);
    });
  }

  public getClient() {
    return this.client;
  }

  public restart(caller) {
    // let permission = roles[role].restart;
    // if (permission) {
        pm2.list((err, pm2Processes) => {
          let restartProcess = undefined;

          pm2Processes.filter((pm2Process) => {
            if (err) console.error(err.stack || err);
            if (pm2Process.pid === process.pid) {
              restartProcess = pm2Process;
            }
          });

          if (restartProcess) {
            EventBus.emit("sendMessage", {caller: caller , msg: "Restarting 3..2..1"});
            setTimeout(() => {
              this.gracefulQuit(restartProcess);
            }, 500);
          } else {
            this.gracefulQuit(false);
            EventBus.emit("sendMessage", {caller: caller , msg: "I can't let you do that....Dave?"});
          }
        });
    // } else {
    //     Messages.reply(msg, "You don't have permission to use this command.");
    // }
  }

  /**
   * Gracefully quits the process.
   * @param {object} [restart] - Restart is the process that should be used to restart.
   */
  public gracefulQuit(pm2Process) {
    console.log("Someone or something stopped me.");
    const voiceServer = this.client.voiceConnections.first();
    voiceServer.channel.leave();
    voiceServer.disconnect();
    this.client.user.setGame(undefined);
    if (pm2Process) {
      pm2.restart(pm2Process);
    } else {
      process.exit(1);
    }
  }
}

const staticCore = new CoreClass();

export const Core = () => {
  return staticCore;
};