"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turntableBot_1 = require("./turntableBot");
const minecraftBot_1 = require("./minecraftBot");
(async function () {
    const mcbot = await (0, minecraftBot_1.genMinecraftBot)();
    const ttbot = await (0, turntableBot_1.genTurntableBot)();
    (0, minecraftBot_1.setupMinecraftBot)(mcbot, { ttbot });
    (0, turntableBot_1.setupTurntableBot)(ttbot, { mcbot });
})();
