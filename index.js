const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Alive'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} FINAL ENGLISH`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket system', options: [
            { name: 'setup', description: 'Setup assistance panel', type: 1 },
            { name: 'close', description: 'Close this ticket', type: 1 },
            { name: 'add', description: 'Add user to ticket', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', description: 'Remove user from ticket', type: 1, options: [{ name: 'user', type: 6, required: true }] },
        ]},
        { name: 'session', description: 'Session commands', options: [
            { name: 'full', description: 'Session is full', type: 1 },
            { name: 'startup', description: 'Start session', type: 1, options: [{ name: 'voters', type: 3, description: 'Voters list', required: false }] },
            { name: 'vote', description: 'Start vote for session', type: 1 },
            { name: 'shutdown', description: 'Shutdown session', type: 1 },
        ]},
        { name: 'claim', description: 'Claim ticket' },
        { name: 'unclaim', description: 'Unclaim ticket' }
    ]);
});

function panelV2() {
    const c = new ContainerBuilder().setAccentColor(0x2B2D31);
    c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png')));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nUse this ticket type for general questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports.\n• Partnership.\n• Questions.\n\n**High Rank Ticket**\n• HR Reports.\n• In-Game Bug Reports.\n• Question For Ownership.\n\n**2026 © California Roleplay.**\nAll rights reserved.`));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
            { label: 'General Ticket', value: 'general', emoji: '📩' },
            { label: 'Internal Affairs Ticket', value: 'internal', emoji: '📩' },
            { label: 'High Rank Ticket', value: 'highrank', emoji: '📩' }
        )
    ));
    return c;
}

function ticketOpenedContent(typeLabel, userId) {
    // senin istediğin format
    return new ContainerBuilder().setAccentColor(0x2B2D31)
       .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${typeLabel}\nHello <@${userId}>, your ticket has been created!\n\nThank you for contacting the assistance. Your ticket has been successfully created.\n\nA staff member will be with you shortly to address your inquiry. To help us assist you faster, please provide any relevant details or documents related to your request while you wait.\n\n**Instructions:**\n🔹 Do not ping the staff; we have been notified.\n🔹 Keep the conversation professional.\n\nTo close this ticket, use the button below.\n\nCalifornia State Utilities`))
       .addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)));
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            if(!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) return i.reply({ content: 'Administrator required.', ephemeral: true });
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: 'Panel deployed successfully.' });
        }

        if(i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?`${ROLES.hr.map(id=>`<@&${id}>`).join(' ')}`: `<@&${ROLES.staff}>`;
            let label = type==='general'?'General Support Ticket':type==='internal'?'Internal Affairs Ticket':'High Rank Ticket';
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            await ch.send({ content: `${i.user} ${tag}`, components: [ticketOpenedContent(label, i.user.id)], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: `Ticket created: ${ch}` });
        }

        if(i.isChatInputCommand() && i.commandName === 'ticket') {
            const sub = i.options.getSubcommand();
            if(sub==='close'){ await i.reply({ content: 'Closing ticket...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
            if(sub==='add'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}); return i.reply({ content: `${u} has been added to the ticket.` }); }
            if(sub==='remove'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.delete(u.id); return i.reply({ content: `${u} has been removed from the ticket.` }); }
        }

        if(i.isButton() && i.customId === 'close'){ await i.reply({ content: 'Closing ticket...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
        if(i.isButton() && i.customId === 'claim'){ await i.channel.permissionOverwrites.edit(i.user.id,{ViewChannel:true,SendMessages:true}); return i.reply({ content: `Ticket claimed by ${i.user}` }); }
        if(i.isButton() && i.customId === 'vote_btn'){
            if(votes.has(i.user.id)) return i.reply({ ephemeral:true, content: 'You have already voted.' });
            votes.add(i.user.id);
            const count = votes.size;
            if(count >= 5){
                votes.clear();
                const c = new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Start Up\n> The California State Roleplay directive team has decided to start the session. All voters must join the game within 15 minutes and remain in the game for at least 15 minutes. We wish you good games.\n\n> Voters:\n${i.user} and 4 others`));
                await i.channel.send({ content: '@here', components: [c], flags: MessageFlags.IsComponentsV2 });
                return i.update({ content: `✅ 5/5 - Session starting!`, components: [], flags: 0 }).catch(()=>{});
            } else {
                return i.reply({ ephemeral: true, content: `Vote counted: ${count}/5` });
            }
        }

        if(i.isChatInputCommand() && i.commandName === 'session'){
            const sub = i.options.getSubcommand();
            if(sub==='shutdown'){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Shutdown\n> We've closed our in-game session to players! We ask that you do not join until you are notified of the session being open. Do not ping our staff to host a session, if you will join to the game, you will be kicked. Thanks.`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='full'){ const ts = Math.floor(Date.now()/1000); const c=new ContainerBuilder().setAccentColor(0xFEE75C).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Full\n> The session has now reached a maximum of 50 players. This does not mean you cannot join. You can join the game after waiting a short while.\n\n> Full Since: <t:${ts}:R>\n\nThank you for your patience.`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='vote'){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0x5865F2).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Vote\n> 5+ votes are required for the session to start; if you want to vote, click the button below. If you have voted, you must stay in the game for at least 15 minutes.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('vote_btn').setLabel('Vote for Session').setStyle(ButtonStyle.Primary).setEmoji('🗳️'))); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='startup'){ votes.clear(); const voters = i.options.getString('voters') || 'No voters listed'; const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Start Up\n> The California State Roleplay directive team has decided to start the session. All voters must join the game within 15 minutes and remain in the game for at least 15 minutes. We wish you good games.\n\n> Voters:\n${voters}`)); return i.reply({ content: '@here', components:[c], flags:MessageFlags.IsComponentsV2 }); }
        }

    } catch(e){ console.error(e); if(!i.replied) try{ await i.reply({ ephemeral:true, content: 'Error: '+e.message }); }catch{} }
});

client.login(process.env.TOKEN);
