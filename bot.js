require('dotenv').config()
const fs = require('fs');
const request = require('request');
const Discord = require('discord.js');

const points = require('./points');

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    // tha boys 683922646022225934
    // dev 279394634667655178

    commands = [
        {
            data: {
                name: "clip",
                description: "Get or play a clip",
                options: [
                    {
                        name: "list",
                        description: "Lists all the clips available to play",
                        type: 1
                    },
                    {
                        name: "play",
                        description: "Plays an audio clip",
                        type: 1,
                        options: [
                            {
                                name: "name",
                                description: "The name of the clip to play",
                                type: 3,
                                required: true
                            }
                        ]
                    }
                ]      
            }
        },
        {
            data: {
                name: "gamble",
                description: "Gamble your points away",
                options: [
                    {
                        name: "flip",
                        description: "Flip a coin for a 50/50 chance of doubling your points",
                        type: 2,
                        options: [
                            {
                                name: "points",
                                description: "Flip for a certain amount of points",
                                type: 1,
                                options: [
                                    {
                                        name: "amount",
                                        description: "The amount of point to flip for",
                                        type: 4,
                                        required: true
                                    }
                                ]
                            },
                            {
                                name: "preset",
                                description: "Flip for a preset of points",
                                type: 1,
                                options: [
                                    {
                                        name: "choice",
                                        description: "The preset you would like to flip for",
                                        type: 3,
                                        required: true,
                                        choices: [
                                            {
                                                name: "half",
                                                value: "half"
                                            },
                                            {
                                                name: "all",
                                                value: "all"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                ]      
            }
        },
        {
            data: {
                name: "points",
                description: "View and handle points",
                options: [
                    {
                        name: "view",
                        description: "View how many points you have",
                        type: 1
                    },
                    {
                        name: "top",
                        description: "View who has the most points",
                        type: 1,
                        options: [
                            {
                                name: "amount",
                                description: "How many people you would like to",
                                type: 4,
                                required: true
                            }
                        ]
                    }
                ]
            }
        }
        
    ]

    commands.forEach(command => {
        // Send to dev server
        client.api.applications(process.env.DISCORD_ID).guilds('279394634667655178').commands.post(command);
        // Send to global
        client.api.applications(process.env.DISCORD_ID).commands.post(command)
    })    
});

client.on('message', message => {
    if (message.guild === null)
    {
        message.attachments.forEach(attachment => {
            if (attachment.url.endsWith('.mp3')) {
                filename = attachment.url.substr(attachment.url.lastIndexOf('/') + 1)
                console.log(filename)
                const files = fs.readdirSync('./audio/');
                var fileExists = false;
                files.forEach(file => {
                    if (filename === file) {
                        fileExists = true;
                    }
                })
                if (fileExists) {
                    message.reply(`A clip with the name ${filename} already exists!`)
                } else {
                    request.get(attachment.url).on('error', console.error).pipe(
                        fs.createWriteStream(`./audio/${filename}`)
                    )
                    message.reply('Clip has been added');
                }
            }
        })
    }
})

// Handle slash commands
client.ws.on('INTERACTION_CREATE', async interaction => {
    // Collect command and args
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;

    console.log(`Command ID: ${interaction.data.id}`);

    // Collect guild, user, and member data
    var guild = client.guilds.cache.get(interaction.guild_id);
    if (guild === null) {
        guild = await client.guilds.fetch(interaction.guild_id);
    }
    var user = client.users.cache.get(interaction.member.user.id);
    if (client === null) {
        user = await client.users.fetch(interaction.member.user.id);
    }

    const member = guild.member(user);
    // add new users

    // Handle clip sub commands
    if (command === "clip") {
        switch (args[0].name) {
            case "list":
                {
                    // Loop over files and add filenames to string
                    const files = fs.readdirSync('./audio/');
                    res = `<@${interaction.member.user.id}>, here are the available clips:\n`;
                    files.forEach(file => {
                        res = `${res}\t${file.substr(0, file.length - 4)}\n`
                    })
                    res = res.substr(0, res.length - 2);

                    // Send the string back to the channel
                    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                        type: 3,
                        data: {
                            content: res
                        }
                    }});
                }
                break;
            case "play":
                {
                    // Check if file exists
                    const clipName = `${args[0].options[0].value}.mp3`
                    const files = fs.readdirSync('./audio/');
                    var fileFound = false;
                    files.forEach(file => {
                        if (clipName === file) {
                            fileFound = true;
                        }
                    })
                    if(!fileFound) {
                        client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                            type: 3,
                            data: {
                                content: `<@${interaction.member.user.id}>, ${args[0].options[0].value} is not a clip!`
                            }
                        }});
                    } else {
                        // Check if user is in a voice channel
                        if (member.voice.channel === null) {
                            client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                                type: 3,
                                data: {
                                    content: `<@${interaction.member.user.id}>, join a voice channel!`
                                }
                            }});
                        } else {
                            // Join voice channel and play clip
                            member.voice.channel.join().then(connection => {
                                connection.play(`./audio/${clipName}`).on('finish', () => {
                                    connection.channel.leave();
                                })
                            })
                        }
                    }
                }
                break;
        }
    } else if (command === "gamble") {
        switch (args[0].name) {
            case "flip":
                {
                    switch (args[0].options[0].name) {
                        case "points":
                            {
                                const userData = points.getUser(interaction.member.user.id);
                                const amount = args[0].options[0].options[0].value
                                if (amount <= 0) {
                                    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                                        type: 3,
                                        data: {
                                            content: `<@${interaction.member.user.id}> tried to type negative points lmao`
                                        }
                                    }});
                                } else if (amount > userData.points) {
                                    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                                        type: 3,
                                        data: {
                                            content: `<@${interaction.member.user.id}> tried to type more points than they have`
                                        }
                                    }});
                                } else {
                                    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                                        type: 3,
                                        data: {
                                            content: `Flipping ${amount} for <@${interaction.member.user.id}>...`
                                        }
                                    }});
                                    await new Promise(r => setTimeout(r, 2000));
                                    if (Math.random() > .5) {
                                        client.api.webhooks(client.user.id,interaction.token).post({data: {
                                            content: `<@${interaction.member.user.id.toString()}> won ${amount} points!`
                                        }});
                                        points.addPoints(interaction.member.user.id, amount, true, true)
                                    } else {
                                        client.api.webhooks(client.user.id,interaction.token).post({data: {
                                            content: `<@${interaction.member.user.id.toString()}> lost ${amount} points...`
                                        }});
                                        points.addPoints(interaction.member.user.id, -amount, false, false)
                                    }
                                }
                            }
                            break;
                        case "preset":
                            {
                                const userData = points.getUser(interaction.member.user.id);
                                var amount = args[0].options[0].options[0].value
                                
                                switch (amount) {
                                    case "half":
                                        amount = Math.round(userData.points / 2);
                                        break;
                                    case "all":
                                        amount = Math.round(userData.points);
                                        break;
                                }
                                client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                                    type: 3,
                                    data: {
                                        content: `Flipping ${amount} for <@${interaction.member.user.id}>...`
                                    }
                                }});
                                await new Promise(r => setTimeout(r, 2000));
                                if (Math.random() > .5) {
                                    client.api.webhooks(client.user.id,interaction.token).post({data: {
                                        content: `<@${interaction.member.user.id.toString()}> won ${amount} points!`
                                    }});
                                    points.addPoints(interaction.member.user.id, amount, true, true)
                                } else {
                                    client.api.webhooks(client.user.id,interaction.token).post({data: {
                                        content: `<@${interaction.member.user.id.toString()}> lost ${amount} points...`
                                    }});
                                    points.addPoints(interaction.member.user.id, -amount, false, false)
                                }
                            }
                            break;
                    }
                }
                break;
        }
    } else if (command === "points") {
        switch (args[0].name) {
            case "view":
                {
                    const userData = points.getUser(interaction.member.user.id);
                    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                        type: 3,
                        data: {
                            content: `<@${interaction.member.user.id}> has ${userData.points.toString()}\nStats:\n\tSpent: ${userData.spent.toString()}\n\tWon ${userData.win.toString()}\n\tLost: ${userData.loss.toString()}\n\tW/L: ${(Math.round((userData.gamesWon / userData.gamesLost) * 100) / 10).toString()}`
                        }
                    }});
                }
                break;
            case "top":
                {
                    var n = args[0].options[0].value;
                    if (n >= Math.min(points.getPersonCount(), 11)) {
                        n = Math.min(points.getPersonCount(), 11)
                    }
                    if (n <= 0) {
                        client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                            type: 3,
                            data: {
                                content: `<@${interaction.member.user.id}>, ${n} is not valid...>`
                            }
                        }});
                    } else {
                        const topPlayers = points.getTop(n);
                        res = ``;
                        topPlayers.forEach((player, index) => {
                            res = `${res}${index.toString()})\t${player.points}\t<@${player.username}>\n`
                        })
                        client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                            type: 3,
                            data: {
                                content: res,
                                allowed_mentions: []
                            }
                        }});
                    }
                }
                break;
        }
    }


});



client.login(process.env.DISCORD_TOKEN)