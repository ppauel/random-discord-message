import { BaseGuildTextChannel, Message, Snowflake, SnowflakeUtil } from 'discord.js';

export function generateSnowflake(date: Date) {
    const snowflake = SnowflakeUtil.generate({ timestamp: date });
    return snowflake;
}

export function asDate(snowflake: Snowflake) {
    const date = new Date(SnowflakeUtil.timestampFrom(snowflake));
    return date;
}

export function getRandomDate(start: Date, end: Date) {
    const startHour = 0,
        endHour = 23,
        date = new Date(+start + Math.random() * (end.valueOf() - start.valueOf())),
        hour = startHour + Math.random() * (endHour - startHour) | 0;
    date.setHours(hour);
    return date;
}

export async function getRandomMessage(options: { from: Date, to: Date, channel: BaseGuildTextChannel }): Promise<false | Message<boolean>> {
    const { from, to, channel } = options,
        /* Message Filter */
        filter = (m: Message | undefined): boolean => (m !== undefined && !m.author.bot && m.cleanContent.length !== 0);

    let i = 0;
    const tries = 10;

    /* Try to fetch a matching message 10 times */
    while (i < tries) {
        i++;
        const snowflake = generateSnowflake(getRandomDate(from, to)).toString();
        const message = (await channel.messages.fetch(
            { around: snowflake, limit: 1, cache: false },
        )).first();

        if (!message) continue;
        if (filter(message)) {
            // console.debug('Found a message with id', message.id);
            return message;
        }
        // console.debug('Fetch failed, trying again...\nTry:', i, 'Snowflake:', snowflake, '\n');
    }

    // console.warn('Failed to fetch a message.');
    return false;
}