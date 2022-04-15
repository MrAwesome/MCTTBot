// @ts-ignore
import Bot from "ttapi";
import type mineflayer from 'mineflayer';

import fs from 'fs';
import {promisify} from 'util';
const readFile = promisify(fs.readFile);

const TTCONFIG_FILENAME = '.ttconfig';

//bot.on('speak', function (data) {
  //// Respond to "/hello" command
  //if (data.text.match(/^\/hello$/)) {
    //bot.speak('Hey! How are you @'+data.name+' ?');
  //}
//});

export async function genTurntableBot(): Promise<any> {
    const ttconfigContents = (await readFile(TTCONFIG_FILENAME)).toString();
    const [AUTH, USERID, ROOMID] = ttconfigContents.split("\n").slice(0, 3);
    //console.log("Auth data:", {AUTH, USERID, ROOMID});
    return new Bot(AUTH, USERID, ROOMID);
}

export async function setupTurntableBot(
    ttbot: any,
    otherBots: {mcbot: mineflayer.Bot},
): Promise<void> {
    const {mcbot} = otherBots;
    //bot.debug = true;
    ttbot.on('ready',        function (_data: any) {
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
