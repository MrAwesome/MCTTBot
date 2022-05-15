import * as cp from 'child_process';
import {promisify} from 'util';

const exec = promisify(cp.exec);

//var cmd = process.spawn(command);

export async function getQuotesJSON(maybeTickers: String[]): Promise<any> {
    const invalidTickers = maybeTickers.filter((t) => !t.match(/^[a-zA-Z\/]+$/));
    if (invalidTickers.length > 0) {
        return `{"error": "Invalid tickers: ${invalidTickers}"}`;
    }

    const spacesTickers = '"' + maybeTickers.join('" "') + '"';

    const res = await exec(`python3 ${__dirname}/Akroma/tda_get_quotes.py ${spacesTickers}`);

    return JSON.parse(res.stdout);
}
