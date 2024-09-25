import { characterName, serverAddress, channelName } from './config.js'
import { Client, GatewayIntentBits } from 'discord.js'
import WebSocket from 'ws'
import { getAuthToken } from './getAuthToken.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

/** @type {WebSocket | undefined} */
let ws
async function connectToGame() {
  const token = await getAuthToken()
  ws = new WebSocket(serverAddress)

  ws.on('open', () => {
    ws.send(JSON.stringify([
      'auth',
      {
        token,
      },
    ]))
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`)
  })

  ws.on('message', async (raw) => {
    let json
    try {
      json = JSON.parse(raw.toString())
    } catch (err) {
      console.error(`Failed to parse JSON: ${err.message}`)
      return
    }

    switch (json[0]) {
      case 'auth': {
        ws.send(JSON.stringify([
          'logInCharacter',
          {
            md: json[1].md,
            skin: json[1].mtx.skin,
            face: json[1].mtx.face,
          },
        ]))

        break
      }
      case 'logInCharacter': {
        console.log('Connected to the game')
        break
      }
      case 'talkGlobal': {
        // expected format:
        // ["talkGlobal","Discord","Hello World!"]
        /** @type {string} */
        const name = json[1]
        /** @type {string} */
        const message = json[2]
        if (name === characterName) {
          // console.log(`Message skipped, due to name "${name}" being the same as the bot's name`)
          return
        }

        console.log(`Sending message to Discord: ${name}: ${message}`)
        for (const guild of client.guilds.cache.values()) {
          for (const channel of guild.channels.cache.values()) {
            if (channel.name !== channelName) {
              continue
            }

            try {
              await channel.send(`${name}: ${message}`)
            } catch (e) {
              console.error(`Failed to send message to channel "${channel.name}" in guild "${guild.name}": ${e.message}`)
            }
          }
        }

        break
      }
      case 'talkLocal': {
        // expected format:
        // ["talkLocal","Discord","Hello World!"]
        /** @type {string} */
        const name = json[1]
        /** @type {string} */
        const message = json[2].toLowerCase()
        if (name === characterName) {
          // console.log(`Message skipped, due to name "${name}" being the same as the bot's name`)
          return
        }

        if (message.startsWith('hi') || message.startsWith('hello') || message.startsWith('hey')) {
          ws.send(JSON.stringify([
            'talkLocal',
            {
              m: `Hello ${name}, please don't hesitate to ask anything on Discord or prefix your message with a # to talk in global chat.`,
            },
          ]))
        }

        break
      }
      default:
      // console.log(json)
    }
  })

  ws.on('close', () => {
    setTimeout(connectToGame, 5000)
  })
}

async function main() {
  client.once('ready', async () => {
    console.log('Connected to Discord')
    await connectToGame()
  });

  await client.login(process.env.DISCORD_TOKEN)

  client.on("messageCreate", async (message) => {
    if (message.channel.name !== channelName) {
      // console.log(`Message skipped, due to being in channel: ${message.channel.name}`)
      return
    }

    if (message?.author.bot) {
      // console.log(`Message skipped, due to author "${message.author.username}" being a bot`)
      return
    }

    if (message.content.length === 0) {
      // console.log(`Message skipped, due to message being empty`)
      return
    }

    console.log(`${message.author.globalName}: ${message.content}`)

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not ready')
      return
    }

    console.log(`Sending message to game: ${message.author.globalName}: ${message.content}`)
    ws.send(JSON.stringify([
      'talkGlobal',
      {
        m: `${message.author.globalName}: ${message.content}`,
      },
    ]))
  })
}

main().catch(console.error)
