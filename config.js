import 'dotenv/config'

if (typeof process.env.DW_USERNAME !== 'string') {
  throw new Error('set DW_USERNAME in .env file')
}

if (typeof process.env.DW_PASSWORD !== 'string') {
  throw new Error('set DW_PASSWORD in .env file')
}

if (typeof process.env.DW_CHARACTER !== 'string') {
  throw new Error('set DW_CHARACTER in .env file')
}

if (typeof process.env.DISCORD_CHANNEL_NAME !== 'string') {
  throw new Error('set DISCORD_CHANNEL_NAME in .env file')
}

export const username = process.env.DW_USERNAME

export const password = process.env.DW_PASSWORD

export const characterName = process.env.DW_CHARACTER

export const channelName = process.env.DISCORD_CHANNEL_NAME

export const serverAddress =
  process.env.DW_SERVER_ADDRESS ?? 'wss://ca1.deepestworld.com/'
