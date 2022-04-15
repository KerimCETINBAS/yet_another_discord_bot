import { Message } from "discord.js";
import { readdir } from "fs"
import { promisify } from "util"

const dirRead = promisify(readdir)
export const CommandParser = async (msg: Message) => {
    if(!msg.content.startsWith(process.env.PREFIX || ";")) return;

    const segments = msg.content.trim().replace(/^;/, "").split(/\s+/i)
    const files = await dirRead(__dirname + "/commands")
    const commandFile = files.find(file => file.replace(/(.js|.ts)/, "") == segments[0])
    if(commandFile)  (await import("./commands/" + commandFile.replace(/(\.js|\.ts)/, "")))?.default(msg, segments)
    else  await msg.reply("No command available " + segments[0]);
}