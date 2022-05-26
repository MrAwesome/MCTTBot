import {placeOrder} from "./akromaLib";

(async () => {
    await placeOrder("EQUITY", "SELL", "RIOT");
    await placeOrder("EQUITY", "SELL", "CAN");
    await placeOrder("EQUITY", "SELL", "TQQQ");
})()
