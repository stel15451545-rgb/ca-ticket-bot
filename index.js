const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Online'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log('✅ CA V2 NO-FORM LIVE');
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup V2 panel', type: 1 },
            { name: 'close', description: 'Close', type: 1 },
            { name: 'closerequest', description: 'Request close', type: 1 },
            { name: 'rename', description: 'Rename', type: 1, options: [{ name: 'name', type: 3, required: true }] },
            { name: 'add', description: 'Add', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', description: 'Remove', type: 1, options: [{ name: 'user', type: 6, required: true }] },
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', type: 1 }, { name: 'startup', type: 1, options: [{ name: 'voters', type: 3, required: false }] },
            { name: 'vote', type: 1 }, { name: 'shutdown', type: 1 }
        ]},
        { name: 'claim', description: 'Claim' },
        { name: 'unclaim', description: 'Unclaim' }
    ]);
});

function panelV2() {
    const c = new ContainerBuilder().setAccentColor(0x2B2D31);
    const media = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png'));
    const text = new TextDisplayBuilder().setContent(`## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nUse this ticket type for general questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports.\n• Partnership.\n• Questions.\n\n**High Rank Ticket**\n• HR Reports.\n• In-Game Bug Reports.\n• Question For Ownership.\n\n**2026 © California Roleplay.**\nAll rights reserved.`);
    const menu = new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
        { label: 'General Ticket', value: 'general', emoji: '📩' },
        { label: 'Internal Affairs Ticket', value: 'internal', emoji: '📩' },
        { label: 'High Rank Ticket', value: 'highrank', emoji: '📩' }
    );
    c.addMediaGalleryComponents(media);
    c.addTextDisplayComponents(text);
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(menu));
    return c;
}

function openedTicket(userId, label) {
    const c = new ContainerBuilder().setAccentColor(0x3B82F6);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${label} TICKET\nHello <@${userId}>, your ticket has been created.\n\nPlease explain your issue in detail and wait for staff.\n-# California State Utilities`));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary)
    ));
    return c;
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            if(!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({ content: 'Admin', ephemeral: true });
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ content: '✅ Panel - Form YOK, foto üstte, dropdown içerde', ephemeral: true });
        }
        if(i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
            let label = type==='general'?'General':type==='internal'?'Internal Affairs':'High Rank';
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            await ch.send({ content: `${i.user} ${tag}`, components: [openedTicket(i.user.id, label)], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ content: `✅ ${ch}`, ephemeral: true });
        }
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'close') { await i.reply({ content: 'Closing...' }); setTimeout(()=>i.channel.delete().catch(()=>{}),2000); }
        if(i.isButton()) {
            if(i.customId === 'close') { await i.reply({ content: 'Closing...' }); setTimeout(()=>i.channel.delete().catch(()=>{}),2000); }
            if(i.customId === 'claim') { await i.channel.permissionOverwrites.edit(i.user.id, { ViewChannel: true, SendMessages: true }); await i.reply({ content: `Claimed by ${i.user}` }); }
        }
        if(i.isChatInputCommand() && i.commandName === 'session') {
            const s = i.options.getSubcommand();
            if(s === 'full') { const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session is Full!`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if(s === 'startup') { votes.clear(); const v = i.options.getString('voters')||''; const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${v}`)); return i.reply({ content: '@here', components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if(s === 'vote') { if(votes.has(i.user.id)) return i.reply({ content: 'Already voted', ephemeral: true }); votes.add(i.user.id); if(votes.size>=5){ votes.clear(); return i.reply({ content: '@here ✅ 5/5 Starting!' }); } return i.reply({ content: `✅ ${votes.size}/5` }); }
            if(s === 'shutdown') { votes.clear(); const c = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Shutdown`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
        }
    } catch(e){ console.error(e); if(!i.replied) i.reply({ content: 'Error '+e.message, ephemeral: true }).catch(()=>{}); }
});
client.login(process.env.TOKEN);
