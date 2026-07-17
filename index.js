const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Alive'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, PermissionsBitField, ChannelType, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

const CATS = {
    general: "1493988237830787155",
    internal: "1507523007524896888",
    highrank: "1507522925602013425"
};
const ROLES = {
    staff: "1493988230406733874",
    hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"]
};

let votes = new Set();
const REQUIRED_VOTES = 5;

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} ONLINE - V2 NO FORM + PORT FIX`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket management', options: [
            { name: 'setup', description: 'Setup V2 panel', type: 1 },
            { name: 'close', description: 'Close ticket', type: 1 },
            { name: 'closerequest', description: 'Request close', type: 1 },
            { name: 'rename', description: 'Rename', type: 1, options: [{ name: 'name', type: 3, required: true }] },
            { name: 'add', description: 'Add user', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', description: 'Remove user', type: 1, options: [{ name: 'user', type: 6, required: true }] },
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', description: 'Full', type: 1 },
            { name: 'startup', description: 'Startup', type: 1, options: [{ name: 'voters', type: 3, required: false }] },
            { name: 'vote', description: 'Vote', type: 1 },
            { name: 'shutdown', description: 'Shutdown', type: 1 },
        ]},
        { name: 'claim', description: 'Claim ticket' },
        { name: 'unclaim', description: 'Unclaim ticket' },
    ]);
});

function ticketPanelV2() {
    const container = new ContainerBuilder().setAccentColor(0x2B2D31);
    const media = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png').setDescription('Assistance'));
    const text = new TextDisplayBuilder().setContent(
`## California Roleplay
Welcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.

### General Support Ticket
Use this ticket type for general questions, assistance with features or inquiries about our community rules.

### Internal Affairs Ticket
• Staff Reports.
• Partnership.
• Questions.

### High Rank Ticket
• HR Reports.
• In-Game Bug Reports.
• Question For Ownership.

**2026 © California Roleplay.**
All rights reserved.`
    );
    const select = new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
        { label: 'General Ticket', value: 'general', emoji: '📩' },
        { label: 'Internal Affairs Ticket', value: 'internal', emoji: '📩' },
        { label: 'High Rank Ticket', value: 'highrank', emoji: '📩' }
    );
    container.addMediaGalleryComponents(media);
    container.addTextDisplayComponents(text);
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(select));
    return container;
}

function openedTicket(typeLabel, userId) {
    const container = new ContainerBuilder().setAccentColor(0x3B82F6);
    const txt = new TextDisplayBuilder().setContent(
`## ${typeLabel} Ticket Created
Hello <@${userId}>, your ticket has been created! Staff will be with you shortly.

**Please explain your issue in detail.**
-# California State Utilities`
    );
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary).setEmoji('🙋'),
        new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );
    container.addTextDisplayComponents(txt);
    container.addActionRowComponents(row);
    return container;
}

client.on('interactionCreate', async i => {
    try {
        if (i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({ content: 'Admin only', ephemeral: true });
            await i.channel.send({ components: [ticketPanelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ content: '✅ V2 Panel - Photo on top, dropdown inside, NO FORM', ephemeral: true });
        }
        if (i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat, allowed, tag, label;
            if (type === 'general') { cat = CATS.general; allowed = [ROLES.staff,...ROLES.hr]; tag = `<@&${ROLES.staff}>`; label = 'General'; }
            else if (type === 'internal') { cat = CATS.internal; allowed = [ROLES.staff,...ROLES.hr]; tag = `<@&${ROLES.staff}>`; label = 'Internal Affairs'; }
            else { cat = CATS.highrank; allowed = ROLES.hr; tag = ROLES.hr.map(id=>`<@&${id}>`).join(' '); label = 'High Rank'; }
            const overwrites = [
                { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] },
            ];
            for (const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({
                name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,90),
                type: ChannelType.GuildText,
                parent: cat,
                topic: i.user.id,
                permissionOverwrites: overwrites
            });
            await ch.send({ content: `${i.user} ${tag}`, components: [openedTicket(label, i.user.id)], flags: MessageFlags.IsComponentsV2 });
            return await i.reply({ content: `✅ Ticket created: ${ch}`, ephemeral: true });
        }
        if (i.isChatInputCommand() && i.commandName === 'ticket') {
            const sub = i.options.getSubcommand();
            if (sub === 'close') { await i.reply({ content: 'Closing in 3s...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2500); return; }
            if (sub === 'closerequest') {
                const owner = i.channel.topic?.match(/\\d{17,20}/)?.[0];
                const mention = owner? `<@${owner}>` : 'there';
                const cont = new ContainerBuilder().setAccentColor(0x2B2D31).addTextDisplayComponents(new TextDisplayBuilder().setContent(`Hi, ${mention}, we're requesting to close your ticket. Press Continue or Cancel.\n\n⚠️ No reply 24h = auto close.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_continue').setLabel('Continue').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('close_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)));
                return i.reply({ content: mention, components: [cont], flags: MessageFlags.IsComponentsV2 });
            }
            if (sub === 'rename') { await i.channel.setName(i.options.getString('name')); return i.reply({ content: '✅ Renamed', ephemeral: true }); }
            if (sub === 'add') { const u = i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); return i.reply(`${u} added!`); }
            if (sub === 'remove') { const u = i.options.getUser('user'); await i.channel.permissionOverwrites.delete(u.id); return i.reply(`${u} removed!`); }
        }
        if (i.isChatInputCommand() && i.commandName === 'session') {
            const sub = i.options.getSubcommand();
            if (sub === 'full') { const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session is Full!\nSince: <t:${Math.floor(Date.now()/1000)}:R>`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if (sub === 'startup') { votes.clear(); const v = i.options.getString('voters') || ''; const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${v}`)); return i.reply({ content: '@here', components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if (sub === 'vote') { if (votes.has(i.user.id)) return i.reply({ content: 'Already voted!', ephemeral: true }); votes.add(i.user.id); if (votes.size >= 5) { votes.clear(); const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started! 5/5 votes!`)); await i.channel.send({ content: '@here', components: [c], flags: MessageFlags.IsComponentsV2 }); return i.reply({ content: `✅ 5/5 - Starting!` }); } else { return i.reply({ content: `✅ ${i.user} voted! ${votes.size}/5` }); } }
            if (sub === 'shutdown') { votes.clear(); const c = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Session Shutdown`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
        }
        if (i.isButton()) {
            if (i.customId === 'claim') { await i.channel.permissionOverwrites.edit(i.user.id, { ViewChannel: true, SendMessages: true }); return i.reply({ content: `✅ Claimed by ${i.user}` }); }
            if (i.customId === 'close' || i.customId === 'close_continue') { await i.reply({ content: 'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
            if (i.customId === 'close_cancel') { return i.reply({ content: '❌ Cancelled.' }); }
        }
    } catch(e) { console.error(e); if (!i.replied &&!i.deferred) await i.reply({ content: 'Error: '+e.message, ephemeral: true }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
