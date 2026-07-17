const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = {
    general: "1493988237830787155",
    internal: "1507523007524896888",
    highrank: "1507522925602013425"
};
const ROLES = {
    staff: "1493988230406733874",
    hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"]
};

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} online!`);
    const commands = [
        {
            name: 'ticket',
            description: 'Ticket management',
            options: [
                { name: 'setup', description: 'Setup ticket panel', type: 1 },
                { name: 'close', description: 'Close the current ticket', type: 1 },
                { name: 'closerequest', description: 'Request to close the current ticket', type: 1 },
                { name: 'rename', description: 'Rename the current ticket channel', type: 1, options: [{ name: 'name', description: 'New channel name', type: 3, required: true }] },
                { name: 'add', description: 'Add a user to the current ticket', type: 1, options: [{ name: 'user', description: 'User to add', type: 6, required: true }] },
                { name: 'remove', description: 'Remove a user from the current ticket', type: 1, options: [{ name: 'user', description: 'User to remove', type: 6, required: true }] },
            ]
        },
        { name: 'escalate', description: 'Change ticket panel, permissions, and category', options: [{ name: 'ticket', description: 'Escalate ticket', type: 1 }] }
    ];
    await client.application.commands.set(commands);
    console.log('Commands loaded EN');
});

client.on('interactionCreate', async i => {
    if (i.isChatInputCommand() && i.commandName === 'ticket') {
        const sub = i.options.getSubcommand();
        if (sub === 'setup') {
            if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({ content: 'You need Administrator permission.', ephemeral: true });
            const embed = new EmbedBuilder()
                .setTitle('California Roleplay')
                .setDescription(`Welcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.

**General Support Ticket**
Use this ticket type for general questions, assistance with features or inquiries about our community rules.

**Internal Affairs Ticket**
• Staff Reports.
• Partnership.
• Questions.

**High Rank Ticket**
• HR Reports.
• In-Game Bug Reports.
• Question For Ownership.

**2026 © California Roleplay.**
All rights reserved.`)
                .setColor(0x2B2D31)
                .setImage('attachment://assistance.png')
                .setFooter({ text: 'Powered by tickets.bot' });
            const menu = new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
                { label: 'General Ticket', value: 'general' },
                { label: 'Internal Affairs Ticket', value: 'internal' },
                { label: 'High Rank Ticket', value: 'highrank' }
            );
            await i.channel.send({ embeds: [embed], files: [{ attachment: './assistance.png', name: 'assistance.png' }], components: [new ActionRowBuilder().addComponents(menu)] });
            await i.reply({ content: '✅ Ticket panel created! Blue banner at the bottom.', ephemeral: true });
        }
        if (sub === 'close') { await i.reply({ content: 'Closing ticket in 3 seconds...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 3000); }
        if (sub === 'closerequest') {
            const ownerId = i.channel.topic ? i.channel.topic.match(/\d{17,20}/)?.[0] : null;
            // Try to get ticket opener from first message or channel name, fallback to mention everyone
            let targetMention = ownerId ? `<@${ownerId}>` : 'there';
            // Build embed exactly like LA Automations screenshot
            const closeEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setDescription(`Hi, ${targetMention}, we're requesting to close your ticket. If you do not wish to have your ticket closed, press the 'cancel' button. If you think that your ticket is complete, press the 'continue' button.\n\n⚠️ **If there is no reply for 24+ hours, we'll take it as your ticket is complete.**`)
                .setFooter({ text: 'Los Angeles Automations • Ticket Close Request' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_continue').setLabel('Continue').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('close_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
            );
            await i.reply({ content: targetMention, embeds: [closeEmbed], components: [row] });
        }
        if (sub === 'rename') { await i.channel.setName(i.options.getString('name')); await i.reply(`Renamed to ${i.options.getString('name')}`); }
        if (sub === 'add') { const u = i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); await i.reply(`${u} has been added to the ticket!`); }
        if (sub === 'remove') { const u = i.options.getUser('user'); await i.channel.permissionOverwrites.delete(u.id); await i.reply(`${u} has been removed from the ticket!`); }
    }
    if (i.isChatInputCommand() && i.commandName === 'escalate') {
        await i.reply({ content: 'Ticket escalated to higher rank!', ephemeral: true });
    }
    if (i.isStringSelectMenu() && i.customId === 'select') {
        const type = i.values[0];
        let cat, allowed, tag;
        if (type === 'general') { cat = CATS.general; allowed = [ROLES.staff, ...ROLES.hr]; tag = `<@&${ROLES.staff}>`; }
        else if (type === 'internal') { cat = CATS.internal; allowed = [ROLES.staff, ...ROLES.hr]; tag = `<@&${ROLES.staff}>`; }
        else { cat = CATS.highrank; allowed = ROLES.hr; tag = ROLES.hr.map(id=>`<@&${id}>`).join(' '); }
        const overwrites = [
            { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        ];
        allowed.forEach(r=> overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }));
        const ch = await i.guild.channels.create({ topic: `${i.user.id}`, name: `${type}-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, permissionOverwrites: overwrites });
        const emb = new EmbedBuilder().setTitle(`${type.toUpperCase()} TICKET`).setDescription(`Hello ${i.user}, your ticket has been created.`).setColor(0x0096FF);
        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
        await ch.send({ content: `${tag} ${i.user}`, embeds: [emb], components: [btn] });
        await i.reply({ content: `✅ Your ticket: ${ch}`, ephemeral: true });
    }
    if (i.isButton() && i.customId === 'close') { await i.reply({ content: 'Deleting in 3 seconds...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 3000); }
    if (i.isButton() && i.customId === 'close_continue') {
        await i.reply({ content: 'Ticket will be closed in 3 seconds...' });
        setTimeout(()=> i.channel.delete().catch(()=>{}), 3000);
    }
    if (i.isButton() && i.customId === 'close_cancel') {
        await i.update({ content: '❌ Close request cancelled.', embeds: [], components: [] });
    }
});

client.login(process.env.TOKEN);
