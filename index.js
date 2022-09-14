require("isomorphic-fetch")
const Discord = require("discord.js")
const cheerio = require("cheerio")
const client = new Discord.Client({ intents: ["GuildMessages", "Guilds", "GuildVoiceStates", "MessageContent"] })
const base = "https://awesomecars.neocities.org/"
const config = require("./config.json")
const { channelLink } = require("discord.js")

function getAll () {
    return fetch(base + "biglist.html").then(res => res.text()).then(body => {
        const $ = cheerio.load(body)
        const cars = []
        //get every child of h2 and put into array
        $("h2").children().each((i, el) => {
            //check is child <br>
            if (el.name === "br") return
            cars.push({ name: $(el).text(), link: $(el).attr("href") })
        })
        return cars
    })
}

async function send (car, channel) {
    let list = await getAll()
    //loosely search for car in list
    if (!car) return channel.send("bozo, add car name")
    let found = list.filter(c => c.name.toLowerCase().includes(car.toLowerCase()))
    if (!found) return channel.send("Car not found")
    if (found.length > 1) {
        //if multiple cars found, send list
        try {
            channel.send("Multiple cars found, be more specitic bozo")
            return
        } catch (e) {
            console.log(e)
            return channel.send("internal error, skill issue")
        }
    }
    list.forEach(c => {
        if (c.name.toLowerCase().includes(car.toLowerCase())) {
            let page = base + c.link
            //replace space with %20
            page = page.replace(/ /g, "%20")
            channel.send(c.name + " be like" + page)
        }
    })
}

async function find (car, channel) {
    let list = await getAll()
    if (!car) return channel.send("bozo, add car name")
    let found = list.filter(c => c.name.toLowerCase().includes(car.toLowerCase()))
    if (!found) return channel.send("no car matching found")
    if (found.length > 0) {
        try {
            channel.send('here are cars i found :tada: :tada: :tada:')
            let embed = new Discord.EmbedBuilder()
            embed.setColor(0x00FF00)
            embed.setDescription(found.map(c => c.name).join('\n'))
            return channel.send({ embeds: [embed] })
        } catch (e) {
            console.log(e)
            return channel.send("error happened, narrow down please")
        }
    } else {
        channel.send("no car matching found")
    }
}

client.on("ready", () => { console.log("ready"); client.user.setActivity("with funny cars") })

client.on("messageCreate", async message => {
    if (message.author.bot) return
    if (message.content.startsWith(config.prefix)) {
        let args = message.content.slice(config.prefix.length).trim().split(/ +/g)
        let command = args.shift().toLowerCase()
        if (command === "get") {
            send(args[0], message.channel)
        } else if (command == "list") {
            let list = await getAll()
            //create embed
            try {


                let embeds = []
                let max = args[0]
                if (!max) max = 20
                embeds.push(new Discord.EmbedBuilder()
                    .setTitle(max + "cars")
                    .setColor(0x00FF00))
                let embed = embeds[0]
                //add fields
                let counter = 0;
                let maybe = true
                for (let i = 0; i < max; i++) {
                    let c = list[i]
                    if (counter == 25) { counter = 0; embeds.push(new Discord.EmbedBuilder().setColor(0x00FF00)); embed = embeds[embeds.length - 1] }
                    embed.addFields({ name: c.name, value: c.link, inline: maybe })
                    counter++
                }
                //send embeds
                console.log(embeds)
                embeds.forEach(e => message.channel.send({ embeds: [e] }))
            } catch (e) {
                console.log(e)
                message.channel.send("skill issue, you messe up")
            }
        } else if (command == "find") {
            find(args[0], message.channel)
        } else if (command == "help") {
            message.channel.send("get - get a car\nlist - list cars (provide number)\nfind - find cars")
        }
    }
})

client.login(config.token)