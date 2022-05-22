import {z} from 'zod';

const timestampSchema = z.number().int();
export const equityTypeSchema = z.union([
    z.literal('EQUITY'),
    z.literal('FOREX'),
    z.literal('CRYPTO'),
]);

export const actionSchema = z.union([z.literal('BUY'), z.literal('SELL')]);
type ZStringLiteralUnion = z.ZodUnion<[z.ZodLiteral<string>, ...z.ZodLiteral<string>[]]>;

export function getLiteralsFromSchema(union: ZStringLiteralUnion): string[] {
    return actionSchema._def.options.map((x) => x._def.value);
}

export const validTickerSchema = z.string().min(1).regex(/^[a-zA-Z\/]+$/);

const tickerLastTimeInfoSchema = z.object({
    lastBuyMs: timestampSchema,
    lastSellMs: timestampSchema,
});
export type TickerLastTimeInfo = z.infer<typeof tickerLastTimeInfoSchema>;

const tickerInfoSchema = z.object({
    ticker: validTickerSchema,
    timeInfo: tickerLastTimeInfoSchema,
    equityType: equityTypeSchema,
});

const allTickerInfoSchema = z.record(tickerInfoSchema.or(z.undefined())).superRefine((obj, ctx) => {
    Object.keys(obj).forEach((t) => {
        if (t !== obj[t]?.ticker) {
            ctx.addIssue({
                code: "custom",
                message: `Ticker key does not match ticker in obj: {t}: {obj}`,
            });
        }
        if (!validTickerSchema.safeParse(t).success) {
            ctx.addIssue({
                code: "custom",
                message: `Invalid ticker name: {t}`,
            });
        }
    })
});

const equityTypeToAllTickerInfoSchema = z.object({
    EQUITY: allTickerInfoSchema,
    FOREX: allTickerInfoSchema,
    CRYPTO: allTickerInfoSchema,
});


export const akromaConfigSchema = z.object({
    transactions: equityTypeToAllTickerInfoSchema,
    lastTransaction: z.object({
        equityType: equityTypeSchema,
        ticker: validTickerSchema,
    }),
});
export type AkromaConfig = z.infer<typeof akromaConfigSchema>;
