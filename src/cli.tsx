import React from 'react'
import {render} from 'ink'
import {App} from './app.js'

const HELP = `
  strm — find any movie or series. type. search. watch.

  Usage
    $ strm

  Options
    --theme <mode>  use auto, light, or dark for this run
    -h, --help      show this help
    -v, --version   show version
`

const args = process.argv.slice(2)

if (args.includes('-h') || args.includes('--help')) {
  console.log(HELP)
  process.exit(0)
}

if (args.includes('-v') || args.includes('--version')) {
  const pkg = JSON.parse(new URL('../package.json', import.meta.url).pathname)
  console.log(pkg.version)
  process.exit(0)
}

let themeMode: 'auto' | 'light' | 'dark' = 'auto'
const themeIdx = args.indexOf('--theme')
if (themeIdx !== -1 && args[themeIdx + 1]) {
  themeMode = args[themeIdx + 1] as any
}

const enterAltScreen = () => process.stdout.write('\x1b[?1049h\x1b[H')
const leaveAltScreen = () => process.stdout.write('\x1b[?1049l')

const isTTY = Boolean(process.stdout.isTTY)

if (isTTY) {
  enterAltScreen()
  process.on('exit', leaveAltScreen)
  for (const event of ['uncaughtException', 'unhandledRejection'] as const) {
    process.on(event, (error: unknown) => {
      leaveAltScreen()
      console.error(error)
      process.exit(1)
    })
  }
}

const {waitUntilExit} = render(<App initialThemeMode={themeMode} />)
await waitUntilExit()
if (isTTY) leaveAltScreen()
