"use strict";
// @ts-ignore
//(process as any).env.DEBUG = 'prismarine-auth';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
(async function () {
    const { Authflow } = await Promise.resolve().then(() => __importStar(require('prismarine-auth')));
    const { RealmAPI } = await Promise.resolve().then(() => __importStar(require('prismarine-realms')));
    const authflow = new Authflow("Gleesus", ".cache/", {
        // For some reason, this needs to be false. 
        authTitle: false,
    });
    const api = RealmAPI.from(authflow, 'java');
    console.log(api);
    const realms = await api.getRealms();
    const realm = realms.find((r) => r.owner === 'lemywinx');
    console.log(realm);
    if (realm === undefined) {
        throw new Error("No realm found!");
    }
    let address = undefined;
    let attempt = 0;
    while (address === undefined && attempt < 5) {
        try {
            address = await realm.getAddress();
            console.log(address);
        }
        catch (e) {
            console.info(`[Attempt ${attempt}] Failed to get realm...`);
            attempt++;
            await sleep(10000);
        }
    }
})();
