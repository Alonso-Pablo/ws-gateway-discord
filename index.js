const WebSocket = require('ws')
require('dotenv').config()

const gateWayVersion = process.env.GATEWAY_VERSION
const gateWayEncoding = process.env.GATEWAY_ENCODING
const token = process.env.BOT_TOKEN
const timetoSubmitCredentials = 5000

const ws = new WebSocket(`wss://gateway.discord.gg/?v=${gateWayVersion}&encoding=${gateWayEncoding}`)

const credentials = {
  op: 2,
  d: {
    token: token,
    intents: 513,
    properties: {
      $os: 'linux',
      $browser: 'chrome',
      $device: 'chrome',
    },
  },
}

let interval
let session_id
let seq

ws.on('open', function open() {
  ws.send(JSON.stringify(credentials))
})

ws.on('close', function close(data) {
  console.log(data) // Log the gateway close event code.
})

ws.on('error', function error(data) {
  console.log('ERROR')
  console.log(data)
})

ws.on('message', function incoming(data) {
  const payload = JSON.parse(data)
  const { t, op, d, s } = payload

  seq = s

  switch (op) {
    case 0:
      // The server received a dispatch of an event.
      break
    case 1:
      // Sometimes the server asks the client for a HeartBeating for no reason.
      ws.send(JSON.stringify({ op: 1, d: null }))
      break
    case 7:
      console.log('SERVER ENVIADO CASO 7. RECONNECT')
      ws.send(JSON.stringify({ op: 6, d: { token, session_id, seq } }))
      break
    case 9:
      // If we can't reconnect, the server will ask us to identify ourselves after 5 seconds.
      reIdentify(timetoSubmitCredentials)
      break
    case 10:
      const heartbeatInterval = d.heartbeat_interval
      interval = heartbeat(heartbeatInterval)
      // The server needs to be constantly sent a 'HeartBeating' before a certain time (heartbeat_interval) or it closes the connection.
      break
    case 11:
      // The server received a HeartBeating.
      console.log('Manteniendo la conexion')
      break
    default:
      console.log(`OP: ${op} DEFAULT`)
      console.log(op, t)
      break
  }

  switch (t) {
    case 'READY':
      session_id = d.session_id
      console.log(`SESSION ID: ${session_id}`)
      console.log(`SEQ: ${s}`)
      console.log('\n')
      break
    case 'MESSAGE_CREATE':
      console.log(`SEQ: ${s}`)
      console.log(`NEW MESSAGE (Server: ${d.guild_id} Channel: ${d.channel_id})`)
      console.log(`${d.author.username} (ID: ${d.author.id}):`)
      console.log('CONTENT')
      console.log(d.content)
      console.log('\n')
      break
  }
})

const reIdentify = (ms) => {
  return setTimeout(() => {
    ws.send(JSON.stringify(credentials))
  }, ms)
}

const heartbeat = (ms) => {
  return setInterval(() => {
    ws.send(JSON.stringify({ op: 1, d: null }))
  }, ms)
}
