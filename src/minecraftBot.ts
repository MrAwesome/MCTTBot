import {BotOptions} from 'mineflayer';
import {pathfinder, Movements, goals} from 'mineflayer-pathfinder';
import mineflayer from 'mineflayer';
import MinecraftData from 'minecraft-data';
import type Turntable from './turntable-api';
import {GlobalOpts} from './types';

import {promisify} from 'util';
const muhSetTimeout = promisify(setTimeout);

const CHAT_DELAY_MS = 100;

export async function genMinecraftBot() {
    const options: BotOptions = {
        username: "GleesusBot",
        host: "buckstand.mc.gg",
        port: 25565,
        auth: "microsoft",
    };

    return mineflayer.createBot(options);
}

export async function setupMinecraftBot(
    mcbot: mineflayer.Bot,
    otherBots: {ttbot: Turntable},
    globalOpts: GlobalOpts,
): Promise<void> {
    const {ttbot} = otherBots;

    let rejoinAttempts = 0;
    mcbot.on('kicked', x => {
        console.log("kicked: ", x);
        if (rejoinAttempts === 0) {
            // TODO: can rejoin here
        }
    });
    mcbot.on('error', x => console.log("error: ", x));

    //bot.on('message', x => console.log("message: ", x));
    //bot.on("chat", x => console.log("chat: ", x));

    mcbot.loadPlugin(pathfinder);

    const goToSleep = async () => {
        const bed = mcbot.findBlock({
            matching: (block) => (mcbot.isABed(block) as unknown as boolean),
        })
        if (bed) {
            try {
                await mcbot.sleep(bed)
                mcbot.chat("I'm sleeping")
            } catch (err: any) {
                mcbot.chat(`I can't sleep: ${err?.message}`)
            }
        } else {
            mcbot.chat('No nearby bed')
        }
    }

    const currentPlaylist = "BOT";

    mcbot.once('spawn', async () => {
        const playerList = Object.keys(mcbot.players).join(", ")
        console.log("Players online: ", playerList);

        const mcData = MinecraftData(mcbot.version);

        // @ts-ignore
        const defaultMove = new Movements(mcbot, mcData);

        mcbot.on('chat', async (username, message) => {
            if (username === mcbot.username) return;
            const target = mcbot.players[username] ? mcbot.players[username].entity : null;

            if (message === '.come') {
                if (!target) {
                    mcbot.chat('I don\'t see you !');
                    return;
                }
                const p = target.position;

                mcbot.pathfinder.setMovements(defaultMove);
                mcbot.pathfinder.setGoal(new goals.GoalNear(p.x, p.y, p.z, 1));
            } else if (message === '.sleep') {
                goToSleep();
            } else if (message === '.mirror') {
                globalOpts.mirror = true;
            } else if (message === '.nomirror') {
                globalOpts.mirror = false;
            } else if (message.startsWith('.wiki ')) {
                const query = message.slice(6).trim();
                const queryString = encodeURIComponent(query);
                mcbot.chat(`https://minecraft.fandom.com/wiki/Special:Search?search=${queryString}`);
            } else if (message === '.turntable_room_link') {
                mcbot.chat(globalOpts.turntableRoomLink ?? "[ERR] Link not set.");
            } else if (message.startsWith('.add ')) {
                const query = message.slice(5).trim();
                if (query) {
                    ttbot.quickAddSong(query, currentPlaylist).then((songRes) => {
                        const {song, artist} = songRes.metadata;
                        mcbot.chat(`> Quick added song: "${artist} - ${song}"`);
                        setTimeout(
                            () => mcbot.chat(`(Say ".del" to pop it from the playlist if this isn't right.)`),
                            CHAT_DELAY_MS);

                    })
                    // TODO: print out
                    // TODO: search
                }
            } else if (message === '.song') {
                ttbot.roomInfo().then((roomInfoRes) => {
                    if (roomInfoRes.success) {
                        const songInfo = roomInfoRes.room.metadata.current_song;

                        if (songInfo) {
                            const {song, artist} = songInfo.metadata;
                            mcbot.chat(`> Now Playing: "${artist} - ${song}"`);
                        } else {
                            mcbot.chat(`> No song currently playing.`);
                        }
                    }
                });
            } else if (message === '.play') {
                ttbot.addDJ();
            } else if (message === '.next' || message === '.skip') {
                ttbot.skipSong();
            } else if (message === '.stop') {
                ttbot.removeDJ();
            } else if (message === '.playlist') {
                ttbot.playlistAll(currentPlaylist).then(async (playlistInfo) => {
                    if (playlistInfo.success === false) return;
                    mcbot.chat(`>>>> Playlist "${currentPlaylist}": <<<<`);
                    const {list} = playlistInfo;
                    if (list.length === 0) {
                        setTimeout(() => mcbot.chat("(Empty!)"), CHAT_DELAY_MS);
                        return;
                    }

                    let i = 0;
                    for (const songRes of list) {
                        const {song, artist} = songRes.metadata;

                        // A little delay for ordering. We need to wait inline like this
                        // to avoid needed to mess with callback chains the length of the playlist
                        await muhSetTimeout(CHAT_DELAY_MS);
                        mcbot.chat(`${i}) ${artist} - ${song}`);
                        i++;
                    }
                });
            } else if (message.startsWith('.change_playlist ')) {
                const playlistName = message.slice(17).trim();
                const res = await ttbot.playlistSwitch(playlistName);
                console.log(res);

                if (res.success === true) {
                    mcbot.chat(`Changed playlist to: "${res.playlist_name}"`);
                } else {
                    mcbot.chat(`Failed to change playlist: "${res.err}"`);
                }

            } else if (message === '.del') {
                ttbot.playlistRemove(0, currentPlaylist);
            } else if (message.startsWith('.del ')) {
                const query = message.slice(5).trim();
                const [arg1, arg2] = query.split(" ");
                if (arg1.match(/^\d+$/)) {
                    ttbot.playlistRemove(parseInt(arg1), arg2 ?? currentPlaylist).then((res) => {
                        if (!res.success) {
                            mcbot.chat(`Failed to delete song from playlist. There may be no song at that index.`);
                        }
                    });
                } else {
                    mcbot.chat(`[ERR] Invalid playlist index: ${arg1}`);
                }
            } else if (message === '.clear') {
                await ttbot.playlistDelete(currentPlaylist);
                await ttbot.playlistCreate(currentPlaylist);
                await ttbot.playlistSwitch(currentPlaylist)
            } else {
                if (globalOpts.mirror) {
                    ttbot.speak(`[MC][${username}] ${message}`);
                }
            }

        });
    });

    console.log("Minecraft bot loaded...");
}

  //search(query: string) {
    //return this.conn.sendMessage({ api: 'file.search', query })
  //}
