const Discord = require("discord.js");
const EmitterBus = require('./EventBus.js');
const path = require('path');
const fs = require('fs');
const URL = require('url');
const jsonfile = require('jsonfile');
const pm2 = require('pm2');
jsonfile.spaces = 2;

const config = require("./config.json");
const roles = require("./roles.json");

const Help = require('./modules/help');
const Messages = require('./modules/chat');
const Stations = require('./modules/radio');
const Playlists = require('./modules/playlist');
const YoutubeHandler = require('./modules/youtube');
const Processor = require('./modules/queue').processor;
const Dice = require('./modules/dice');
const Eightball = require('./modules/8ball');
const Filter = require('./modules/filter');

//Module List
const Play = require('./modules/play');

const client = new Discord.Client();
let globalStations = new Stations();
let voiceChannel;
let voiceConnection;
let incompleteAtStartup = [];

process.on('beforeExit', gracefulQuit);
process.on('SIGINT', gracefulQuit);

/**
 * Gracefully quits the process.
 * @param {object} [restart] - Restart is the process that should be used to restart.
 */
function gracefulQuit(restart) {
    console.log("Someone or something stopped me.");
    voiceChannel.leave();
    client.user.setGame(null);
    if (restart) {
        pm2.restart(restart);
    } else {
        process.exit(1);
    }
}


if (!fs.existsSync(path.resolve(__dirname, config.stage))) {
    console.log("Creating Staging Folder");
    fs.mkdirSync(path.resolve(__dirname, config.stage));
    console.log("Staging Folder Created");
}

if (!fs.existsSync(path.resolve(__dirname, config.playlists_folder))) {
    console.log("Creating Playlist Folder");
    fs.mkdirSync(path.resolve(__dirname, config.playlists_folder));
    console.log("Playlist Folder Created");
}

if (!fs.existsSync(path.resolve(__dirname, config.playlists_folder, 'global.json'))) {
    console.log("Creating Playlist Global File");
    fs.writeFileSync(path.resolve(__dirname, config.playlists_folder, 'global.json'),'{}');
    console.log("Playlist Global File Created");
}

if (!fs.existsSync(path.resolve(__dirname, 'radio.json'))) {
    console.log("Creating Radio File");
    fs.writeFileSync(path.resolve(__dirname, 'radio.json'),'{}');
    console.log("Radio File Created");
}

if (fs.existsSync(path.resolve(__dirname, config.stage, "incomplete"))) {
    console.log("Clearing Incomplete Download Folder");
    incompleteAtStartup = fs.readdirSync(path.resolve(__dirname, config.stage, "incomplete"));
    console.log("incompleteFiles", incompleteAtStartup);
    incompleteAtStartup.forEach(function (fileName) {
        fs.unlinkSync(path.resolve(__dirname, config.stage, "incomplete", fileName));
        if (config.resume_incomplete) {
            autoDownload(fileName);
        }
    });
} else {
    fs.mkdirSync(path.resolve(__dirname, config.stage, "incomplete"));
    console.log("Creating Incomplete Folder");
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}!`);
    let channel = client.channels.get(config.channel);
    
    voiceChannel = channel;
        
    channel.join()
        .then(function(connection){
            voiceConnection = connection;
        })
        .catch(console.error);
});

client.on('message', msg => {
    if(!msg.content.startsWith(config.prefix) && (msg.author.id !== client.user.id)){
        if(config.language_filter.running){
            Filter.check(msg);
        }
        return;
    }
    //Identifies the command of the user
    let command = msg.content.split(" ")[0];
    command = command.slice(config.prefix.length);
    //arguments made upon the command (array)
    let args = msg.content.split(" ").slice(1);
    //ID's the users role and assigns permissions
    let role = "default";  
    
    for (var key in roles) {
        if (key !== "default") {
            config.roles[key].forEach(function(entry) {
                if (msg.author.id == entry) {
                    role = key;
                }
            });
        }
    }
    
    switch(msg.channel.type){
        case "dm":
            handleDirectMessage(msg, command, args, role);
            break;
        case "group":
            handleGroupMessage(msg, command, args, roles);
            break;
        case "text":
        default:
            handleTextMessage(msg, command, args, role);
            break;
            
    }
    
});

// Direct Message Handler
function handleDirectMessage (msg, command, args, role) {
    
    switch(command){
        case "help":
            Messages.reply(msg, `currently only playlists are availible in DM, use "${config.prefix}playlist help" for a list of commands`);
            break;
        case "playlist":
            Playlists.dmPlaylist(msg, args, role);
            break;
        case "queue":
            break;
        case "lockdown":
            break;
        case "blacklist":
            break;
    }
}

// Group Message Handler
function handleGroupMessage (msg, command, args, role) {
    
}

// Text Channel Message Handler
function handleTextMessage (msg, command, args, role) {   
    //cleans bot messages in text channels
    if (msg.author.id === client.user.id) {
        msg.delete(120000);
        return;
    }
    
    switch(command.toLowerCase()){
        case "play":
            //Processor.play(msg, args, role, voiceConnection, client);
            let stations = globalStations.getStations();
            if(args[0]){
                if(args[0].indexOf('youtu.be') > -1 ||
                   args[0].indexOf('youtube.com') > -1 ||
                   args[0].indexOf('www.youtube.com') > -1) {
                       if(args[0].indexOf('list=') > -1) {
                           EmitterBus.emit('event', {cmd: "playYoutubePlaylist", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                       } else {
                           EmitterBus.emit('event', {cmd: "playYoutube", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                       }
                    
                } else if(args[0].indexOf('.mp3') > -1) {
                    EmitterBus.emit('event', {cmd: "playPodcast", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                } else if(args[0] == "playlist"){
                    EmitterBus.emit('event', {cmd: "playPlaylist", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                } else if(stations.indexOf(args[0]) > -1){
                    EmitterBus.emit('event', {cmd: "playRadio", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                } else {
                    EmitterBus.emit('event', {cmd: "playYoutubeSearch", msg: msg, args: args, role: role, vc: voiceConnection, client: client});
                }
            } else {
                Messages.reply(msg, "Play? play what? come on work with me here!");
            }
            break;
        case "presets":
        case "stations":
            Help.showPresets(msg, globalStations);
            break;
        case "skip":
            EmitterBus.emit('event', {cmd: "skip", msg: msg, role: role, client: client});
            break;
        case "queue":
            EmitterBus.emit('event', {cmd: "showQueue", msg: msg});
            break;
        case "clear":
            EmitterBus.emit('event', {cmd: "clearQueue", msg: msg, args: args, role: role});
            break;
        case "help":
            Help.helpRequest(msg);
            break;
        case "join":
            joinChannel(msg, args.length > 1 ? args.join(" ") : args[0], role);
            break;
        case "savequeue":
            /*globalQueue.saveQueue('bob', function(item) {
                return item.id;
            });*/
            break;
        case "loadqueue":
            //globalQueue.loadQueue('bob');
            break;
        case "volume":
            EmitterBus.emit('event', {cmd: "changeVolume", msg: msg, args: args, role: role});
            break;
        case "remove":
            EmitterBus.emit('event', {cmd: "removePlaylist", msg: msg, args: args, role: role});
            break;
        case "restart":
            restart(msg, role);
            break;
        case "playlists":
            Help.playlistDisplay(msg, role, client);
            break;
        case "roll":
        case "dice":
        case "random":
            Dice.roll(msg, args, role);
            break;
        case "8ball":
            Eightball.shake(msg, role);
            break;
        default:
            Messages.reply(msg, command + ' is not a valid command, use ' + config.prefix + 'help for assistance.');
    }
}

function restart (msg, role) {
    let permission = roles[role].restart;
    if (permission) {
        Messages.reply(msg, "IMA RESTARTING MA LASER!");
        pm2.list(function(err, pm2Processes) {
            pm2Processes.filter(function(pm2Process){
                if (err) console.error(err.stack || err);
                if (pm2Process.pid === process.pid) {
                    setTimeout(function() {
                        gracefulQuit(pm2Process);
                    }, 500);
                }
            });
        });
    } else {
        Messages.reply(msg, "You don't have permission to use this command.");
    }
}

function joinChannel (msg, requestedChannel, role) {
    let permission = roles[role].joinChannel;
    if (permission) {
        
        // get Channel ID from channel
        let channel;
        if (!requestedChannel) {
            channel = msg.member.voiceChannel;
        } else {
            channel = client.channels.find(val => {
                return val.type === 'voice' && val.name === requestedChannel;
            });
        }
        if (!channel || msg.channel.guild.id != channel.guild.id) {
            Messages.reply("Channel does not exist on your server.");
            return;
        }
        
        voiceChannel = channel;
        
        channel.join()
            .then(function(connection){
                voiceConnection = connection;
            })
            .catch(console.error);
        
    } else {
        Messages.reply("You do not have permission to use this command.");
    }
}

function autoDownload (file) {
    console.log('Auto Download for '+file+' started.');
    YoutubeHandler.download(file, function(){
        console.log('Auto Download for '+file+' completed.');
    });
}

client.login(config.token);