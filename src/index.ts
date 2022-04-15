import { Client, Intents, Interaction, Collection, Message } from "discord.js"
import { config } from "dotenv"
import { CommandParser } from "./commandParser"
import PouchDb = require("pouchdb");
import { totalmem } from "os";
const db = new PouchDb("reactions")
import { createServer, IncomingMessage, ServerResponse } from "http"
config()

createServer((req: IncomingMessage, res: ServerResponse) => res.end()).listen(process.env.PORT || 3000)

const bot: Client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]})

bot.on("messageCreate", CommandParser)
bot.on("messageReactionAdd", async (reaction:any, user:any) => {
    if(user.bot) return;
    let d: any = (await db.allDocs({include_docs:true}))
    if(!(d.total_rows > 0)) return;
    const {doc} =d.rows?.find((row: any)=> row.doc?._id == reaction.message.guildId + row.doc.roleGroup && row.doc.messageId == reaction.message.id)
    for(const role of doc.roles) {
        if(role.emoji.trim() == reaction.emoji.name || reaction.emoji.id ==role.emoji.replace(/[^\d]+/g,"") ) {
            const roleId = role.role.replace(/[^\d]+/g,"") 
            const member = await reaction.message.guild?.members.fetch(user.id)
            let userHasRole = member?.roles.cache.get(roleId)
            if(userHasRole) {
                member?.roles.remove(roleId)  
                reaction.users.remove(user.id) 
                break
            }
            member?.roles.add(roleId) 
            reaction.users.remove(user.id) 
            break 
        } 
    } 
})



bot.login(process.env.BOT_TOKEN)


export { bot }