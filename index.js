const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Live'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ONLINE NO COLOR + FIXED`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup V2 panel', type: 1 },
            { name: 'close', description: 'Close', type: 1 }
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', type: 1 }, { name: 'startup', type: 1, options: [{ name: 'voters', type: 3, required: false }] },
            { name: 'vote', type: 1 }, { name: 'shutdown', type: 1 }
        ]}
    ]);
});

function panelV2() {
    // RENK YOK - setAccentColor koymuyoruz
    const c = new ContainerBuilder();
    c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png')));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## California State Roleplay
Welcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.

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

-# **2026 © California Roleplay.**`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
            { label: 'General Ticket', value: 'general' },
            { label: 'Internal Affairs Ticket', value: 'internal' },
            { label: 'High Rank Ticket', value: 'highrank' }
        )
    ));
    return c;
}

function ticketOpened(label, userId) {
    // RENK YOK
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## ${label}
Hello <@${userId}>, your ticket has been created!

Thank you for contacting the assistance. Your ticket has been successfully created.

A staff member will be with you shortly to address your inquiry. To help us assist you faster, please provide any relevant details or documents related to your request while you wait.

**Instructions:**
🔹 Do not ping the staff; we have been notified.
🔹 Keep the conversation professional.

To close this ticket, use the button below.

-# Powered by California State Utilities`
    ));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    ));
    return c;
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ flags: 64, content: 'Panel deployed - no color' });
        }

        if(i.isStringSelectMenu() && i.customId === 'select') {
            await i.deferReply({ flags: 64 });
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
            let label = type==='general'?'General Support Ticket':type==='internal'?'Internal Affairs Ticket':'High Rank Ticket';
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });

            // FIX: 2 AYRI MESAJ - V2 hatası çözüldü + ping atacak
            await ch.send({ content: `${i.user} ${tag}` });
            await ch.send({ components: [ticketOpened(label, i.user.id)], flags: MessageFlags.IsComponentsV2 });

            return i.editReply({ content: `Ticket: ${ch}` });
        }

        if(i.isButton() && i.customId === 'close'){ await i.reply({ content: 'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'close'){ await i.reply({ content: 'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}),2000); }

        if(i.isChatInputCommand() && i.commandName === 'session'){
            const sub = i.options.getSubcommand();
            if(sub==='shutdown'){ const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Shutdown\n> We've closed our in-game session to players! We ask that you do not join until you are notified of the session being open. Do not ping our staff to host a session, if you will join to the game, you will be kicked. Thanks.`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='vote'){ const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Vote\n> 5+ votes are required for the session to start; if you want to vote, click the button below. If you have voted, you must stay in the game for at least 15 minutes.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('vote_btn').setLabel('Vote').setStyle(ButtonStyle.Primary))); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='startup'){
                const v=i.options.getString('voters')||'No voters';
                const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Start Up\n> The California State Roleplay directive team has decided to start the session. All voters must join the game within 15 minutes and remain in the game for at least 15 minutes. We wish you good games.\n\n> Voters:\n${v}`));
                await i.reply({ content: '@here' });
                return i.followUp({ components:[c], flags:MessageFlags.IsComponentsV2 });
            }
            if(sub==='full'){ const ts=Math.floor(Date.now()/1000); const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Full\n> The session has now reached a maximum of 50 players. This does not mean you cannot join. You can join the game after waiting a short while.\n\n> Full Since: <t:${ts}:R>`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
        }
    } catch(e){ console.error(e); if(i.deferred) await i.editReply({ content:'Error: '+e.message }).catch(()=>{}); else if(!i.replied) await i.reply({ flags:64, content:'Error: '+e.message }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
