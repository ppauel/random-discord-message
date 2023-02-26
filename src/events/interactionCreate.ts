import { ApplicationCommandType, Events, Interaction, InteractionType, RepliableInteraction } from 'discord.js';
import ExtendedClient from '../classes/Client';
import { Event } from '../interfaces';

const errorMessage = 'There was an error while executing this interaction.';
// Send a warning on error
async function replyError(error: unknown, client: ExtendedClient, interaction: RepliableInteraction) {
    if (error instanceof Error) {
        console.error(error);
        if (client.config.interactions.replyOnError) return;

        if (interaction.deferred) {
            await interaction.followUp({ content: errorMessage }).catch(console.error);
        }
        else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
        }

    }
}

const event: Event = {
    name: Events.InteractionCreate,
    execute: async (client, interaction: Interaction) => {
        try {
            switch (interaction.type) {
            case InteractionType.ApplicationCommand:
                switch (interaction.commandType) {
                // Chat Input Command
                case ApplicationCommandType.ChatInput:
                    client.commands.get(interaction.commandName)?.execute(client, interaction);
                    break;
                default:
                    break;
                }
                break;
            default:
                break;
            }
        }
        catch (error) {
            if (interaction.isRepliable()) replyError(error, client, interaction);
            else console.error(error);
        }
    },

};

export default event;