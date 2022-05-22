import {writeConfig, readConfig} from "./akromaLib";

(async () => {
    const config = await readConfig();
    config.transactions['FOREX'] = {}
    await writeConfig(config);
})()
