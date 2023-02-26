import { ActionRowBuilder, BaseGuildTextChannel, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, GuildMember, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { asDate, getRandomMessage } from '../../features/random';
import { ChatInputCommand } from '../../interfaces';

// Example slash command
const command: ChatInputCommand = {
    options: new SlashCommandBuilder()
        .setName('random-message')
        .setDescription('Show a random message and guess the author')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages)
        .addChannelOption(option => option
            .setRequired(false)
            .setName('channel')
            .setDescription('Pick a random message from this channel'),
        ),
    global: true,
    execute: async (_client, interaction) => {
        await interaction.deferReply().catch(console.error);
        const channel = interaction.options.getChannel('channel', false) || interaction.channel;
        if (!(channel instanceof BaseGuildTextChannel)) {
            await interaction.editReply({ content: 'Can\'t fetch messages in the selected channel.' }).catch(console.error);
            return;
        }
        if (!channel.permissionsFor(interaction.member as GuildMember).has(PermissionFlagsBits.ReadMessageHistory) ||
            !channel.permissionsFor(interaction.member as GuildMember).has(PermissionFlagsBits.ViewChannel)) {
            await interaction.editReply({ content: 'You don\'t have permission to read messages in this channel. Try to select another channel using the `channel` option.' }).catch(console.error);
            return;
        }
        const
            from = asDate(channel.id),
            to = channel.lastMessageId?.length ? asDate(channel.lastMessageId) : new Date(),
            message = await getRandomMessage({ from: from, to: to, channel: channel });

        if (!message) {
            await interaction.editReply({ content: 'Failed to fetch a message. Try to select another channel using the `channel` option.' }).catch(console.error);
            return;
        }

        const
            revealButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setCustomId('reveal')
                .setLabel('Reveal author'),

            linkButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(message.url)
                .setLabel('View in chat'),

            rowHidden = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder(revealButton.data).setDisabled(false),
                new ButtonBuilder(linkButton.data).setDisabled(true),
            ),

            rowShown = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder(revealButton.data).setDisabled(true),
                new ButtonBuilder(linkButton.data).setDisabled(false),
            ),

            embed = new EmbedBuilder()
                .setAuthor({ name: 'Hidden Author', iconURL: _client.user?.avatarURL() || undefined })
                .setColor(_client.config.colors.embed)
                .setDescription(message.cleanContent.length ? message.cleanContent : null)
                .setTimestamp(message.createdTimestamp),

            filter = (buttonInteraction: ButtonInteraction) => buttonInteraction.customId === 'reveal';

        (await interaction.editReply({
            embeds: [embed],
            components: [rowHidden],
            allowedMentions: { repliedUser: false },
        })).createMessageComponentCollector<ComponentType.Button>({
            filter,
            time: 900_000,
            max: 1,
        }).once('collect', async (buttonInteraction) => {
            embed.setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL() || undefined });
            await buttonInteraction.update({ components: [rowShown], embeds: [embed] });
        });
    },
};
export default command;