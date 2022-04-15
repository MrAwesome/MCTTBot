"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMinecraftBot = exports.genMinecraftBot = void 0;
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const mineflayer_1 = __importDefault(require("mineflayer"));
const minecraft_data_1 = __importDefault(require("minecraft-data"));
async function genMinecraftBot() {
    const options = {
        username: "GleesusBot",
        host: "buckstand.mc.gg",
        port: 25565,
        auth: "microsoft",
    };
    return mineflayer_1.default.createBot(options);
}
exports.genMinecraftBot = genMinecraftBot;
async function setupMinecraftBot(mcbot, otherBots) {
    const { ttbot } = otherBots;
    mcbot.on('kicked', x => console.log("kicked: ", x));
    mcbot.on('error', x => console.log("error: ", x));
    //bot.on('message', x => console.log("message: ", x));
    //bot.on("chat", x => console.log("chat: ", x));
    mcbot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
    const goToSleep = async () => {
        const bed = mcbot.findBlock({
            matching: (block) => mcbot.isABed(block),
        });
        if (bed) {
            try {
                await mcbot.sleep(bed);
                mcbot.chat("I'm sleeping");
            }
            catch (err) {
                mcbot.chat(`I can't sleep: ${err === null || err === void 0 ? void 0 : err.message}`);
            }
        }
        else {
            mcbot.chat('No nearby bed');
        }
    };
    mcbot.once('spawn', async () => {
        const playerList = Object.keys(mcbot.players).join(", ");
        console.log("Players online: ", playerList);
        const mcData = (0, minecraft_data_1.default)(mcbot.version);
        // @ts-ignore
        const defaultMove = new mineflayer_pathfinder_1.Movements(mcbot, mcData);
        mcbot.on('chat', function (username, message) {
            if (username === mcbot.username)
                return;
            const target = mcbot.players[username] ? mcbot.players[username].entity : null;
            if (message === '.come') {
                if (!target) {
                    mcbot.chat('I don\'t see you !');
                    return;
                }
                const p = target.position;
                mcbot.pathfinder.setMovements(defaultMove);
                mcbot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalNear(p.x, p.y, p.z, 1));
            }
            else if (message === '.sleep') {
                goToSleep();
            }
            else if (message.startsWith('.add ')) {
                ttbot.playlistSwitch("BOT");
                const targ = message.slice(5);
                console.log(targ);
                if (targ) {
                    ttbot.searchSong(targ, (searchRes) => {
                        const { docs } = searchRes;
                        const song = docs[0];
                        console.log(song);
                        console.log(song.metadata);
                        ttbot.playlistAdd("BOT", song._id);
                        // TODO: print out
                        // TODO: search
                    });
                }
            }
            else if (message === '.play') {
                ttbot.playlistSwitch("BOT", () => ttbot.addDj(console.log));
            }
            else if (message === '.next' || message === '.skip') {
                ttbot.playlistSwitch("BOT", () => ttbot.skip());
            }
            else if (message === '.stop') {
                ttbot.remDj();
            }
            else if (message === '.playlist') {
                ttbot.playlistAll("BOT", console.log);
            }
            else if (message === '.clear') {
                ttbot.playlistDelete("BOT", () => ttbot.playlistCreate("BOT", () => ttbot.playlistSwitch("BOT")));
            }
            else {
                ttbot.speak(`[MC][${username}] ${message}`);
            }
        });
    });
    console.log("Bot loaded...");
}
exports.setupMinecraftBot = setupMinecraftBot;
