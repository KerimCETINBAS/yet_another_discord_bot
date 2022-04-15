import { Emoji, Guild, Message, TextChannel, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import PouchDb = require("pouchdb");
import { bot } from "..";

const db = new PouchDb("reactions")
const subcommands: Record<string, Function> = {

    getall: async(msg:Message, segments: string[]) => {
        const allGroups: any[] =  (await db.allDocs({ include_docs: true})).rows.filter((row: any) => row.doc!.guild == msg.guildId && row.doc!.roleGroup !== undefined)
        const embed = new MessageEmbed()
            .setTitle('Roles')
        	.setColor('#0099ff')
        for(const {doc} of allGroups ) {
            embed.addField("Role group", doc.roleGroup || "\u200B")
            .addField("Roles", "\u200B")
            .addFields(
                doc.roles.map((r:any) => {
                    const role = msg.guild?.roles.cache.get(r.role.trim().replace(/[^\d]+/g,""))
                    return {
                        name: role?.name || "\u200B", value: r.emoji || "\u200B", inline: true
                    }
                })
            )
            .addField("------------------------------------------------------------------------------------------------","\u200B")
        }
        msg.reply({embeds: [embed]})
    },
    create : async (msg:Message, segments: string[]) => {
        if(!msg.member?.permissions.has("ADMINISTRATOR")) return;
        if(segments.length < 5) { 
            const rep = msg.reply(" Eksik parametre \r\n\"role create <messageId> <emoji> <role>\" şeklinde yazınız.")
            msg.delete()
            ;(await rep).delete()
            return
        }
        segments.shift()
        segments.shift()
        // segments[0] msg id
        // segments[1] channel id
        // segments[2] groupname
        await db.get(msg.guildId + segments[2]).then(async function (doc) {
            await db.put({
                _id:   msg.guildId + segments[2],
                guild: msg.guild?.id,
                messageId: segments[0],
                channelId: segments[1],
                roleGroup: segments[2],
                roles: [],
                _rev: doc._rev
            })
        }).catch(async function (err) {
            await db.put({
                _id:   msg.guildId + segments[2],
                guild: msg.guild?.id,
                messageId: segments[0],
                channelId: segments[1],
                roleGroup: segments[2],
                roles: []
                
            }) 
        });
    },

    add :  async(msg:Message, segments: string[]) => {
        if(!msg.member?.permissions.has("ADMINISTRATOR")) return;
        segments.shift()
        segments.shift()
        //segments[0] groupName
        //segments[1] emoji
        //segments[2] role
        const allGroups: any[] =  (await db.allDocs({ include_docs: true})).rows.filter((row: any) => row.doc!.roleGroup == segments[0])
        if(allGroups.length > 0) {
            const doc = allGroups[0].doc
            const index = doc.roles.findIndex((r:any) => r.emoji == segments[1])
            if(!(index > -1)) {
                doc.roles.push({
                    role: segments[2],
                    emoji: segments[1]
                })
                await db.put(doc)
            }
            const channel = bot.channels.cache.get(doc.channelId) as TextChannel
            const message = await channel.messages.fetch(doc.messageId)
            message.react(segments[1].trim())
        }
      
    },

    update:  (msg:Message, segments: string[]) => {
        if(!msg.member?.permissions.has("ADMINISTRATOR")) return;
        if((segments.length < 5)) return msg.reply("eksik parametre")
        segments.shift()
        segments.shift()
        // segments[0] group name
        // segments[1] emoji
        // segments[2] new role
    },

    remove:  async (msg:Message, segments: string[]) => {
        if(!msg.member?.permissions.has("ADMINISTRATOR")) return;
        if((segments.length < 4)) return msg.reply("eksik parametre")
        segments.shift()
        segments.shift()
          // segments[0] group name
          // segments[1] emoji
        const group: any = ( await db.get(msg.guildId + segments[0]))
        group.roles.splice(group.roles.findIndex((r: any) => r.emoji == segments[1].trim()),1)
        await db.put(group)
        const channel = bot.channels.cache.get(group.channelId) as TextChannel
        const message = await channel.messages.fetch(group.messageId)
        await message.reactions.removeAll()
     
    },
    removegroup: async (msg:Message, segments: string[]) => {
        if(!msg.member?.permissions.has("ADMINISTRATOR")) return;
        if((segments.length < 3)) return msg.reply("eksik parametre")
        segments.shift()
        segments.shift()
        // segments[0] group name
        await db.get(msg.guildId + segments[0]).then(doc => db.remove(doc))
    },
    help: (msg: Message, segments: string[]) => {

    }
}
export default async (msg: Message, segments: string[]) => {
    if(subcommands[segments[1]]) subcommands[segments[1]](msg, segments)
    else msg.reply("unknow subcommand " + segments[1])
}