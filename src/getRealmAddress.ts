// @ts-ignore
//(process as any).env.DEBUG = 'prismarine-auth';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async function () {
    const { Authflow } = await import('prismarine-auth');
    const { RealmAPI } = await import('prismarine-realms');

    const authflow = new Authflow(
        "Gleesus",
        ".cache/",
        {
            // For some reason, this needs to be false.
            authTitle: false as any,
        }
    );

    const api = RealmAPI.from(authflow, 'java');
    console.log(api);

    const realms = await api.getRealms();
    const realm = realms.find((r) => r.owner === 'lemywinx');
    console.log(realm);

    if (realm === undefined) {
        throw new Error("No realm found!");
    }
    let address: Awaited<ReturnType<typeof realm.getAddress>> | undefined = undefined;
    let attempt = 0;
    while (address === undefined && attempt < 5) {
        try {
            address = await realm.getAddress();
            console.log(address);
        } catch (e) {
            console.info(`[Attempt ${attempt}] Failed to get realm...`);
            attempt++;
            await sleep(10000);
        }
    }
})()
