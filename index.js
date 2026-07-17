const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Alive'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
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

let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} ONLINE`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup V2 panel', type: 1 },
            { name: 'close', description: 'Close', type: 1 },
            { name: 'rename', description: 'Rename', type: 1, options: [{ name: 'name', type: 3, required: true }] },
            { name: 'add', description: 'Add', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', description: 'Remove', type: 1, options: [{ name: 'user', type: 6, required: true }] }
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', type: 1, description: 'Full' },
            { name: 'startup', type: 1, description: 'Startup', options: [{ name: 'text', type: 3, required: false, description: 'Voters' }] },
            { name: 'vote', type: 1, description: 'Vote' },
            { name: 'shutdown', type: 1, description: 'Shutdown' }
        ]},
        { name: 'claim', description: 'Claim' },
        { name: 'unclaim', description: 'Unclaim' }
    ]);
});

function panel() {
    const container = new ContainerBuilder().setAccentColor(0x2B2D31);
    const media = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png'));
    const text = new TextDisplayBuilder().setContent(`## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nUse this ticket type for general questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports.\n• Partnership.\n• Questions.\n\n**High Rank Ticket**\n• HR Reports.\n• In-Game Bug Reports.\n• Question For Ownership.\n\n**2026 © California Roleplay.**\nAll rights reserved.`);
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

client.on('interactionCreate', async i => {
    try {
        if (i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({ ephemeral: true, content: 'Admin lazım' });
            await i.channel.send({ components: [panel()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: '✅ V2 panel atıldı - foto üstte dropdown içerde, form yok direkt açılıyor' });
        }
        if (i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat, allowed, tag, label;
            if (type === 'general') { cat = CATS.general; allowed = [ROLES.staff,...ROLES.hr]; tag = `<@&${ROLES.staff}>`; label = 'General'; }
            else if (type === 'internal') { cat = CATS.internal; allowed = [ROLES.staff,...ROLES.hr]; tag = `<@&${ROLES.staff}>`; label = 'Internal Affairs'; }
            else { cat = CATS.highrank; allowed = ROLES.hr; tag = ROLES.hr.map(id=>`<@&${id}>`).join(' '); label = 'High Rank'; }
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }];
            for (const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            const opened = new ContainerBuilder().setAccentColor(0x3B82F6).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${label} Ticket\nHello <@${i.user.id}>, your ticket has been created. Staff will be with you shortly.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'), new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary)));
            await ch.send({ content: `${i.user} ${tag}`, components: [opened], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: `✅ ${ch}` });
        }
        if (i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'close') { await i.reply({ content: 'Kapatıyorum...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
        if (i.isChatInputCommand() && i.commandName === 'session') {
            const sub = i.options.getSubcommand();
            if (sub === 'full') { const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session Full!`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if (sub === 'startup') { votes.clear(); const t = i.options.getString('text') || ''; const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${t}`)); return i.reply({ content: '@here', components: [c], flags: MessageFlags.IsComponentsV2 }); }
            if (sub === 'vote') { if (votes.has(i.user.id)) return i.reply({ ephemeral: true, content: 'Zaten oy verdin' }); votes.add(i.user.id); if (votes.size >= 5) { votes.clear(); return i.channel.send({ content: '@here ✅ 5/5 Session başlıyor!' }).then(()=> i.reply({ content: '5/5 oldu!' })); } return i.reply({ content: `✅ ${votes.size}/5` }); }
            if (sub === 'shutdown') { votes.clear(); const c = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Shutdown`)); return i.reply({ components: [c], flags: MessageFlags.IsComponentsV2 }); }
        }
        if (i.isButton() && i.customId === 'close') { await i.reply({ content: 'Kapatılıyor...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
        if (i.isButton() && i.customId === 'claim') { await i.channel.permissionOverwrites.edit(i.user.id, { ViewChannel: true, SendMessages: true }); await i.reply({ content: `Claimed ${i.user}` }); }
    } catch(e) { console.error(e); if (!i.replied) i.reply({ ephemeral: true, content: e.message }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
