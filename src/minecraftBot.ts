import {BotOptions} from 'mineflayer';
import {pathfinder, Movements, goals} from 'mineflayer-pathfinder';
import mineflayer from 'mineflayer';
import MinecraftData from 'minecraft-data';

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
    otherBots: {ttbot: any},
): Promise<void> {
    const {ttbot} = otherBots;
    mcbot.on('kicked', x => console.log("kicked: ", x));
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

    mcbot.once('spawn', async () => {
        const playerList = Object.keys(mcbot.players).join(", ")
        console.log("Players online: ", playerList);

        const mcData = MinecraftData(mcbot.version);

        // @ts-ignore
        const defaultMove = new Movements(mcbot, mcData);

        mcbot.on('chat', function (username, message) {
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
            } else if (message.startsWith('.add ')) {
                ttbot.playlistSwitch("BOT");
                const targ = message.slice(5);
                console.log(targ);
                if (targ) {
                    ttbot.searchSong(targ, (searchRes: any) => {
                        const {docs} = searchRes;
                        const song = docs[0];
                        console.log(song);
                        console.log(song.metadata);
                        ttbot.playlistAdd("BOT", song._id);
                        // TODO: print out
                        // TODO: search
                    });
                }
            } else if (message === '.play') {
                ttbot.playlistSwitch("BOT", () => ttbot.addDj(console.log));
            } else if (message === '.next' || message === '.skip') {
                ttbot.playlistSwitch("BOT", () => ttbot.skip());
            } else if (message === '.stop') {
                ttbot.remDj();
            } else if (message === '.playlist') {
                ttbot.playlistAll("BOT", console.log)
            } else if (message === '.clear') {
                ttbot.playlistDelete("BOT", () =>
                    ttbot.playlistCreate("BOT", () =>
                        ttbot.playlistSwitch("BOT")
                    )
                );
            } else {
                ttbot.speak(`[MC][${username}] ${message}`)
            }

        })
    })

    console.log("Bot loaded...");
}
