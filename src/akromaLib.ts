import * as cp from 'child_process';
import {promisify} from 'util';
import {lockMutex} from './lib';
import * as path from 'path';

import {readFile, writeFile} from 'fs';
import {actionSchema, AkromaConfig, akromaConfigSchema, equityTypeSchema, TickerLastTimeInfo, validTickerSchema} from './akromaSchemas';

const exec = promisify(cp.exec);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const ALLOWED_ORDER_ACTIONS = ['BUY', 'SELL'] as const;
type AllowedOrderAction = typeof ALLOWED_ORDER_ACTIONS[number];
const ALLOWED_EQUITIES = ['HIVE'] as const;
type AllowedEquity = typeof ALLOWED_EQUITIES[number];

const CONFIG_FILE_LOCATION = 'tmp/akromaConfig.json';

//var cmd = process.spawn(command);

export async function getQuotes(maybeTickers: String[]): Promise<any> {
    const invalidTickers = maybeTickers.filter((t) => !t.match(/^[a-zA-Z\/]+$/));
    if (invalidTickers.length > 0) {
        return {error: `Invalid tickers: ${invalidTickers}`};
    }

    const spacesTickers = maybeTickers.map((s) => `"${s}"`).join(" ");

    const res = await exec(`python3 ${__dirname}/Akroma/tda_get_quotes.py ${spacesTickers}`);

    return JSON.parse(res.stdout);
}


export async function placeOrder(
    maybeEquityType: string,
    maybeAction: string,
    maybeTicker: string,
): Promise<{error: any} | {success: any}> {
    maybeAction = maybeAction.toUpperCase();

    const equityType = equityTypeSchema.parse(maybeEquityType);
    const ticker = validTickerSchema.parse(maybeTicker);
    const action = actionSchema.parse(maybeAction);

    if (!ALLOWED_EQUITIES.includes(ticker as AllowedEquity)) {
        return {error: `Ticker not allowed: ${maybeTicker}. Allowed tickers: [${ALLOWED_EQUITIES.join(", ")}].`};
    }
    const knownTicker = ticker as AllowedEquity;

    const config = await readConfig();
    // TODO: lookup crypto vs equity etc

    let updateTimeKey: keyof TickerLastTimeInfo;
    switch (action) {
        case "BUY": {
            updateTimeKey = "lastBuyMs";
        };
        case "SELL": {
            updateTimeKey = "lastSellMs";
        }
    }
    //const equityType = "EQUITY";
    if (config.transactions[equityType][knownTicker] === undefined) {
        config.transactions[equityType][knownTicker] = {
            timeInfo: {lastBuyMs: Date.now(), lastSellMs: Date.now()},
            ticker: knownTicker,
            equityType,
        }
    } else {
        config.transactions[equityType][knownTicker]!.timeInfo[updateTimeKey] = Date.now();
    }

    const ret = await placeOrderINTERNAL(action, knownTicker);
    const output = ret.stdout;

    if (output.match(/[\[\{]/)) {
        const parsed = JSON.parse(output);
        if ("error" in parsed || "success" in parsed) {
            return parsed;
        }
    }
    return {error: "Script possibly succeeded, but output was unexpected format. See console."};
}

async function placeOrderINTERNAL(
    action: AllowedOrderAction,
    ticker: AllowedEquity,
) {
    return exec(`python3 ${__dirname}/Akroma/tda_place_order.py "${action}" "${ticker}"`);
}

export async function writeConfig(config: AkromaConfig): Promise<void> {
    return lockMutex("CONFIG").then(async (release) => {
        const ret = await writeFileAsync(
            path.join("./", CONFIG_FILE_LOCATION),
            JSON.stringify(akromaConfigSchema.parse(config)));
        release();
        return ret;
    });
}

export async function readConfig(): Promise<AkromaConfig> {
    return lockMutex("CONFIG").then(async (release) => {
        const ret = await readFileAsync(path.join("./", CONFIG_FILE_LOCATION));
        release();
        return ret;
    }).then((buf) => akromaConfigSchema.parse(JSON.parse(buf.toString())));
}
