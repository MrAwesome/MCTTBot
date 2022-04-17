import {genTurntableBot, setupTurntableBot} from "./turntableBot";
import {genMinecraftBot, setupMinecraftBot} from "./minecraftBot";

(async function () {
    const mcbot = await genMinecraftBot();
    const ttbot = await genTurntableBot();

    const globalOpts = {mirror: true};

    setupMinecraftBot(mcbot, {ttbot}, globalOpts);
    setupTurntableBot(ttbot, {mcbot}, globalOpts);
})();

