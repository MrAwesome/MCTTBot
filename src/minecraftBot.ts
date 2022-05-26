import {BotOptions} from 'mineflayer';
import {pathfinder, Movements, goals} from 'mineflayer-pathfinder';
import mineflayer, {Instrument} from 'mineflayer';
import {Block} from 'prismarine-block'
import MinecraftData from 'minecraft-data';
import type Turntable from './turntable-api';
import {GlobalOpts} from './types';

import { Vec3 } from 'vec3'
import {promisify} from 'util';
import {getQuotes, placeOrder} from './akromaLib';
import type {} from './akromaSchemas';

const muhSetTimeout = promisify(setTimeout);
const CHAT_DELAY_MS = 100;

const SIGN_UPDATE_MS = 10000;
let signInterval: null | ReturnType<typeof setInterval> = null;
let cachedSignText = "\nLoading...";

let doNotTrade = true;

// TODO: red or green banner based on how sheep based trading strategy is doing

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
    // TODO: handle timeouts?
    try {
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

            mcbot.on('noteHeard', async (block, instrument, pitch) => handleNote(mcbot, block, instrument, pitch));
            mcbot.on('playerJoined', async (player) => console.log(`[INFO]: Player joined: ${player.username}`));

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

                        }).catch(console.error);
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
                    }).catch(console.error);
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
                    }).catch(console.error);
                } else if (message.startsWith('.change_playlist ')) {
                    const playlistName = message.slice(17).trim();
                    const res = await ttbot.playlistSwitch(playlistName);

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
                        }).catch(console.error);
                    } else {
                        mcbot.chat(`[ERR] Invalid playlist index: ${arg1}`);
                    }
                } else if (message === '.clear') {
                    await ttbot.playlistDelete(currentPlaylist);
                    await ttbot.playlistCreate(currentPlaylist);
                    await ttbot.playlistSwitch(currentPlaylist)
                } else if (message.startsWith('.ticker ')) {
                    const query = message.slice(8).trim();
                    const tickers = query.split(" ");
                    getQuotes(tickers).then(async (resp) => {
                        if ("error" in resp) {
                            mcbot.chat(`[ERR]: ${resp['error']}`);
                        } else {
                            const payload = resp['success'];
                            for (const pair of Object.entries(payload)) {
                                const [ticker, payload] = pair;
                                const {assetType, assetMainType, mark} = payload as Record<string, any>;
                                mcbot.chat(`${ticker}: ${mark} - (${assetMainType}/${assetType})`);
                                await muhSetTimeout(CHAT_DELAY_MS);
                            }
                        }
                    }).catch(console.error);
//                } else if (message === '.book') {
//                    console.log(mcbot.inventory.items());
//                    const book = mcbot.inventory.items().find((i) => i.name === 'writable_book');
//                    if (book) {
//                        console.log({book});
//                        mcbot.writeBook(book.slot, ["FUFDOSIJFDSOIJ"]).then(async () => {
//                            //await mcbot.toss(book.type, null, null);
//                            await mcbot.equip(book, 'hand');
//                            const lecternBlock = mcbot.blockAt(new Vec3(-88, 9, -141), true);
//                            if (lecternBlock && lecternBlock.name === 'lectern') {
//                                console.log("LKDJFLSKJDFLKJLDKSJF!!!!!!");
//                                const lectEntity = lecternBlock.blockEntity;
//                                if (lectEntity) {
//                                    const ent = await mcbot.activateEntity(lectEntity as any);
//                                    console.log({ent});
//                                }
//                            }
//                        });
//                    }
                } else if (message === '.trade') {
                    doNotTrade = false;
                } else if (message === '.notrade') {
                    doNotTrade = true;
                } else if (message === '.sign') {
                    if (signInterval !== null) {
                        clearInterval(signInterval);
                        signInterval = null;
                    }
                    updateSignCache();
                    updateSign(mcbot);
                    signInterval = setInterval(() => {
                        updateSignCache();
                        updateSign(mcbot);
                    }, SIGN_UPDATE_MS);

                } else if (message === '.debug') {
                    console.log({signInterval, cachedSignText});
                } else if (message.startsWith('.order ')) {
                    const query = message.slice(7).trim();
                    const cmd = query.split(" ");
                    if (cmd.length !== 3) {
                        mcbot.chat('[ERR]: Expected 3 args: `.order <EQUITY/CRYPTO/FOREX> <BUY/SELL> <ticker>`');
                        return;
                    }
                    const [maybeEquityType, maybeAction, maybeTicker] = cmd;
                    placeOrder(maybeEquityType, maybeAction, maybeTicker).then(async (resp) => {
                        if ("error" in resp) {
                            mcbot.chat(`[ERR]: ${resp['error']}`);
                        } else {
                            const payload = resp['success'];
                            mcbot.chat(payload);
                        }
                    }).catch(console.error);
                } else {
                    if (globalOpts.mirror) {
                        ttbot.speak(`[MC][${username}] ${message}`);
                    }
                }
            });
        });

        console.log("Minecraft bot loaded...");
    } catch (e) {
        mcbot.chat(`[ERR]: ${e}`)
    }
}

let stockIndex = 0;
const stocks = ['RIOT', 'CAN', 'TQQQ'];
let orderTypesForEquitiesIndex = 0;
const orderTypesForEquities = ['BUY_OR_SELL_INCLUDING_SHORT', 'BUY_CHEAP_PUT_OR_CALL_NEAREST', 'BUY_CHEAP_PUT_OR_CALL_FURTHEST'] as const;
// buy the best option whose price is the same as the cheapest option

async function handleNote(mcbot: mineflayer.Bot, _block: Block, instrument: Instrument, pitch: number) {
    if (instrument.id === 0 && pitch === 15) {
        mcbot.chat("!!! Skeleton farm overflow detected! Time to clear out the chests. !!!");
    } else if (instrument.id === 6 && pitch === 3) {
        if (doNotTrade) {
            return;
        }
        placeOrder("EQUITY", "SELL", stocks[stockIndex]).then(async (resp) => {
            if ("error" in resp) {
                mcbot.chat(`[ERR]: ${resp['error']}`);
            } else {
                const payload = resp['success'];
                mcbot.chat(payload);
            }
        }).catch(console.error);
    } else if (instrument.id === 6 && pitch === 15) {
        if (doNotTrade) {
            return;
        }
        placeOrder("EQUITY", "BUY", stocks[stockIndex]).then(async (resp) => {
            if ("error" in resp) {
                mcbot.chat(`[ERR]: ${resp['error']}`);
            } else {
                const payload = resp['success'];
                mcbot.chat(payload);
            }
        }).catch(console.error);
    } else if (instrument.id === 9 && pitch === 3) {
        stockIndex = (stockIndex + 1) % stocks.length
        console.log('Taking the index up: ', stockIndex);
    } else if (instrument.id === 9 && pitch === 15) {
        orderTypesForEquitiesIndex = (orderTypesForEquitiesIndex + 1) % orderTypesForEquities.length;
    }

}

async function updateSignCache() {
    const resp = await getQuotes(['RIOT', 'CAN', 'TQQQ']);
        if ("error" in resp) {
            console.log("Error fetching quotes!", resp['error']);
        } else {
            const msgs: string[] = [];
            const payload = resp['success'];
            for (const pair of Object.entries(payload)) {
                const [ticker, payload] = pair;
                const {mark} = payload as Record<string, any>;
                const tick = `${ticker}: ${mark}`.slice(0, 15);
                msgs.push(tick);
            }
            cachedSignText = msgs.join('\n');
        }

}

async function updateSign(mcbot: mineflayer.Bot) {
    const oldSignBlock = mcbot.blockAt(new Vec3(-88, 10, -141), true);

    if (oldSignBlock && oldSignBlock.name !== 'air' && mcbot.canDigBlock(oldSignBlock)) {
        await mcbot.dig(oldSignBlock);
        await muhSetTimeout(200);
    }

    const signPostBlock = mcbot.blockAt(new Vec3(-88, 9, -141), true);
    let newSignBlock: Block | null = null;
    const signInInv = mcbot.inventory.items().find((item) => item.name === "oak_sign");
    if (signInInv && signPostBlock) {
        mcbot.equip(signInInv, 'hand').then(async () => {
        await mcbot.placeBlock(signPostBlock, new Vec3(0, 1, 0));
            newSignBlock = mcbot.blockAt(new Vec3(-88, 10, -141), true);
            if (newSignBlock !== null) {
                mcbot.updateSign(newSignBlock, cachedSignText);
            }
        }).catch(console.error);
    }

}
