import {genTurntableBot, setupTurntableBot} from "./turntableBot";
import {genMinecraftBot, setupMinecraftBot} from "./minecraftBot";

(async function () {
    const mcbot = await genMinecraftBot();
    const ttbot = await genTurntableBot();

    setupMinecraftBot(mcbot, {ttbot});
    setupTurntableBot(ttbot, {mcbot});
})();

