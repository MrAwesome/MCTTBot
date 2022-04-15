"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTurntableBot = exports.genTurntableBot = void 0;
// @ts-ignore
const ttapi_1 = __importDefault(require("ttapi"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
const TTCONFIG_FILENAME = '.ttconfig';
//bot.on('speak', function (data) {
//// Respond to "/hello" command
//if (data.text.match(/^\/hello$/)) {
//bot.speak('Hey! How are you @'+data.name+' ?');
//}
//});
async function genTurntableBot() {
    const ttconfigContents = (await readFile(TTCONFIG_FILENAME)).toString();
    const [AUTH, USERID, ROOMID] = ttconfigContents.split("\n").slice(0, 3);
    //console.log("Auth data:", {AUTH, USERID, ROOMID});
    return new ttapi_1.default(AUTH, USERID, ROOMID);
}
exports.genTurntableBot = genTurntableBot;
async function setupTurntableBot(ttbot, otherBots) {
    const { mcbot } = otherBots;
    //bot.debug = true;
    ttbot.on('ready', function (_data) {
        ttbot.speak("Loaded!");
        mcbot.chat("Turntable room ready!");
        //bot.roomRegister(ROOMID, function() {
        //bot.setAsBot();
        //});
        //  bot.searchSong("pyramid song", (searchRes) => {
        //    
        //    const {docs} = searchRes;
        //    const song = docs[0];
        //    console.log(song);
        //    console.log(song.metadata);
        //    bot.playlistAdd("BOT", song._id);
        //    for (const doc of docs) {
        //      console.log(doc);
        //    }
        //  });
    });
}
exports.setupTurntableBot = setupTurntableBot;
