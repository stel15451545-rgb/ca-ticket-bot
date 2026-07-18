const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Live'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };

const SESSION_MANAGER_ID = '1477713335389655248';
const SUPPORT_TEAM_ID = '1493988230406733874';
const BANNER_FILE = './LAB_1.png';
const BANNER_URL = 'attachment://LAB_1.png';

let votes = new Set();
let voteUsers = [];

function getBannerGallery(){
    return new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(BANNER_URL));
}

function hasSupportRole(member){
    if(!member) return false;
    if(member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    return member.roles.cache.has(SUPPORT_TEAM_ID) || member.roles.cache.has(SESSION_MANAGER_ID) || ROLES.hr.some(r => member.roles.cache.has(r)) || member.roles.cache.has(ROLES.staff);
}

function buildVotePanel() {
    const votersText = voteUsers.length > 0? voteUsers.map(u => `🔹 <@${u.id}> (${u.tag})`).join('\n') : 'No votes yet.';
    return new ContainerBuilder()
.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`# Session Vote
> 5+ votes are required for the session to start; if you want to vote, click the button below. If you have voted, you must stay in the game for at least 15 minutes.

**Voters:**
${votersText}`
    ))
.addMediaGalleryComponents(getBannerGallery())
.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vote_btn').setLabel('Vote').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('vote_count').setLabel(`Votes: ${votes.size}/5`).setStyle(ButtonStyle.Secondary).setDisabled(true)
    ));
}

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} FIXED`);
    client.user.setPresence({
        activities: [{ name: '.gg/carpp', type: 0, state: 'Apply for California State Roleplay Staff Team!' }],
        status: 'online'
    });
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket system', options: [
            { name: 'setup', description: 'Setup V2 panel', type: 1 },
            { name: 'close', description: 'Close ticket', type: 1 },
            { name: 'closerequest', description: 'Request close', type: 1 },
            { name: 'rename', description: 'Rename ticket', type: 1, options: [{ name: 'name', description: 'New name', type: 3, required: true }] },
            { name: 'add', description: 'Add user', type: 1, options: [{ name: 'user', description: 'User', type: 6, required: true }] },
            { name: 'remove', description: 'Remove user', type: 1, options: [{ name: 'user', description: 'User', type: 6, required: true }] }
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', description: 'Session full', type: 1 },
            { name: 'startup', description: 'Startup', type: 1, options: [{ name: 'voters', description: 'Voters list', type: 3, required: false }] },
            { name: 'vote', description: 'Start vote', type: 1 },
            { name: 'shutdown', description: 'Shutdown', type: 1 }
        ]},
        { name: 'claim', description: 'Claim ticket' },
        { name: 'unclaim', description: 'Unclaim ticket' }
    ]);
});

function panelV2() {
    const c = new ContainerBuilder();
    c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png')));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## California Roleplay
> Welcome to Assistance section.

**General Support Ticket**
- General questions.

**Internal Affairs Ticket**
- Staff Reports.
- Partnership.

**High Rank Ticket**
- HR Reports.
- Bug Reports.

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
    return new ContainerBuilder()
.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## ${label}
Hello <@${userId}>, your ticket has been created!

Thank you for contacting the assistance. Your ticket has been successfully created.

A staff member will be with you shortly to address your inquiry. To help us assist you faster, please provide any relevant details or documents related to your request while you wait.

**Instructions:**
🔹 Do not ping the staff; we have been notified.
🔹 Keep the conversation professional.

To close this ticket, use the button below.`
    ))
.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('claim').setLabel('Claim Ticket').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('closerequest').setLabel('Close Request').setStyle(ButtonStyle.Secondary)
    ));
}

function buildCloseRequest(ownerId, requesterId){
    return new ContainerBuilder()
.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## Close Request
Hi, <@${ownerId}>, we're requesting to close your ticket. If you do not wish to have your ticket closed, press the cancel button. If you think that your ticket is completed, press the continue button.

If there is no reply for 24+ hours, we'll close this.

-# Requested by <@${requesterId}>`
    ))
.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_confirm').setLabel('Continue').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('cancel_close').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    ));
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            if (!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Session Manager can use this.' });
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ flags: 64, content: 'Panel deployed.' });
        }

        if(i.isStringSelectMenu() && i.customId === 'select') {
            await i.deferReply({ flags: 64 });
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
            let label = type==='general'?'General Support Ticket':type==='internal'?'Internal Affairs Ticket':'High Rank Ticket';
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,90), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            await ch.send({ content: `${i.user} ${tag}` });
            await ch.send({ components: [ticketOpened(label, i.user.id)], flags: MessageFlags.IsComponentsV2 });
            return i.editReply({ content: `Ticket created: ${ch}` });
        }

        if(i.isChatInputCommand() && i.commandName === 'ticket') {
            const sub = i.options.getSubcommand();
            if (sub!== 'setup' &&!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Support Team can use ticket commands.' });
            if(sub==='close'){ await i.reply({ content: 'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 1500); return; }
            if(sub==='closerequest'){
                const owner = i.channel.topic?.match(/\d{17,20}/)?.[0] || i.user.id;
                return i.reply({ content: `<@${owner}>`, components: [buildCloseRequest(owner, i.user.id)], flags: MessageFlags.IsComponentsV2 });
            }
            if(sub==='rename'){ await i.channel.setName(i.options.getString('name')); return i.reply({ content: 'Renamed.' }); }
            if(sub==='add'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}); return i.reply({ content: `${u} added.` }); }
            if(sub==='remove'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.delete(u.id); return i.reply({ content: `${u} removed.` }); }
        }

        if(i.isButton()){
            if(i.customId==='vote_btn'){
                if(votes.has(i.user.id)) return i.reply({ flags:64, content:'Already voted.' });
                votes.add(i.user.id);
                voteUsers.push({ id: i.user.id, tag: i.user.username });
                if(votes.size>=5){
                    const finalVoters = voteUsers.map(u => `🔹 <@${u.id}>`).join('\n');
                    const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Start Up\n> Session started!\n\n**Voters:**\n${finalVoters}`)).addMediaGalleryComponents(getBannerGallery());
                    await i.message.edit({ components:[buildVotePanel()], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                    await i.channel.send({ components:[c], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                    votes.clear(); voteUsers = [];
                    return i.reply({ flags:64, content:'5/5 - Starting!' });
                }
                await i.message.edit({ components:[buildVotePanel()], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                return i.reply({ flags:64, content:`Voted! (${votes.size}/5)` });
            }

            if(['close','claim','closerequest','close_confirm','cancel_close'].includes(i.customId)){
                if(!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Support Team can use this button.' });
            }

            if(i.customId==='close' || i.customId==='close_confirm'){ await i.reply({ content: 'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 1000); return; }
            if(i.customId==='cancel_close') return i.reply({ content: 'Cancelled.', flags: 64 });
            if(i.customId==='closerequest'){
                const owner = i.channel.topic?.match(/\d{17,20}/)?.[0] || '0';
                return i.reply({ content: `<@${owner}>`, components: [buildCloseRequest(owner, i.user.id)], flags: MessageFlags.IsComponentsV2 });
            }
            if(i.customId==='claim'){
                await i.channel.permissionOverwrites.edit(i.user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
                return i.reply({ content: `Claimed by ${i.user}` });
            }
        }

        if(i.isChatInputCommand() && i.commandName === 'claim'){
            if (!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Support Team can claim.' });
            await i.channel.permissionOverwrites.edit(i.user.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}); return i.reply({ content: `Claimed by ${i.user}` });
        }
        if(i.isChatInputCommand() && i.commandName === 'unclaim'){
            if (!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Support Team can unclaim.' });
            return i.reply({ content: 'Unclaimed' });
        }

        if(i.isChatInputCommand() && i.commandName === 'session'){
            if (!hasSupportRole(i.member)) return i.reply({ flags: 64, content: 'Only Session Manager can use this.' });
            const sub = i.options.getSubcommand();
            if(sub==='shutdown'){
                const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Shutdown\n> We've closed our in-game session to players! We ask that you do not join until you are notified of the session being open. Do not ping our staff to host a session, if you will join to the game, you will be kicked. Thanks.`)).addMediaGalleryComponents(getBannerGallery());
                await i.channel.send({ components:[c], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                return i.reply({ flags: 64, content: '✅ Sent' });
            }
            if(sub==='vote'){
                votes.clear(); voteUsers = [];
                await i.channel.send({ components:[buildVotePanel()], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                return i.reply({ flags: 64, content: '✅ Sent' });
            }
            if(sub==='startup'){
                const v=i.options.getString('voters')||'No voters';
                const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Start Up\n> Session started!\n\n> Voters:\n${v}`)).addMediaGalleryComponents(getBannerGallery());
                await i.channel.send({ content: '@here', components:[c], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                return i.reply({ flags: 64, content: '✅ Sent' });
            }
            if(sub==='full'){
                const ts=Math.floor(Date.now()/1000);
                const c=new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Session Full\n> Max 50 players.\n\n> Full Since: <t:${ts}:R>`)).addMediaGalleryComponents(getBannerGallery());
                await i.channel.send({ components:[c], files: [{ attachment: BANNER_FILE, name: 'LAB_1.png' }], flags:MessageFlags.IsComponentsV2 });
                return i.reply({ flags: 64, content: '✅ Sent' });
            }
        }
    } catch(e){ console.error(e); if(i.deferred) await i.editReply({ content:'Error: '+e.message }).catch(()=>{}); else if(!i.replied) await i.reply({ flags:64, content:'Error: '+e.message }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
