//import Bot from "ttapi";
import type mineflayer from 'mineflayer';

import Turntable from "./turntable-api";

import fs from 'fs';
import {promisify} from 'util';
import {GlobalOpts} from './types';
const readFile = promisify(fs.readFile);

const TTCONFIG_FILENAME = '.ttconfig';

export async function genTurntableBot(): Promise<Turntable> {
    // TODO: Error checking
    const ttconfigContents = (await readFile(TTCONFIG_FILENAME)).toString();
    const [userAuth, userId, roomId] = ttconfigContents.split("\n").slice(0, 3);
    //return new Bot(AUTH, USERID, ROOMID);
    const ttbot = new Turntable({userAuth, userId, roomId});
    return ttbot;
}

export async function setupTurntableBot(
    ttbot: Turntable,
    otherBots: {mcbot: mineflayer.Bot},
    globalOpts: GlobalOpts,
): Promise<void> {
    const {mcbot} = otherBots;

    await ttbot.authenticate();

    const turntableRoomLink = `https://turntable.fm/${ttbot.roomId}`;
    globalOpts.turntableRoomLink = turntableRoomLink;
    //mcbot.chat(`Turntable room ready! ${turntableRoomLink}`);

    ttbot.on('speak', (data) => {
        // NOTE: these should be consistent between id and Id
        const {name, text, userid} = data;
        if (userid === ttbot.conn.userid) return;


        if (text === '.mirror') {
            globalOpts.mirror = true;
        } else if (text === '.nomirror') {
            globalOpts.mirror = false;
        } else {
            mcbot.chat(`[TT][${name}] ${text}`);
        }
    });

    console.log("Turntable bot loaded!");
}
