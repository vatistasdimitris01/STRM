import React, {useCallback, useEffect, useState} from 'react'
import {Box, Text, useApp, useInput, useStdout} from 'ink'
import Spinner from 'ink-spinner'
import open from 'open'
import {FramedInput} from './components/framed-input.js'
import {FullScreen} from './components/fullscreen.js'
import {Logo} from './components/logo.js'
import {Shortcuts} from './components/shortcuts.js'
import {TextInput} from './components/text-input.js'
import {ThemeProvider, type ThemeMode, useTheme} from './theme.js'
import {searchTMDB, mediaTitle, mediaYear, mediaType, type MediaResult} from './lib/tmdb.js'
import {ensurePlayerRunning, getPlayerUrl} from './lib/server.js'
import {truncate, wrapText} from './lib/format.js'

const TAGLINE = 'find any movie or series. type. search. done.'

type Phase =
  | {name: 'input'; warning?: string}
  | {name: 'searching'}
  | {name: 'results'; results: MediaResult[]; query: string}
  | {name: 'empty'; query: string}
  | {name: 'watching'; title: string; results: MediaResult[]; query: string}
  | {name: 'error'; message: string}

const Gap = ({lines = 1}: {lines?: number}) => (
  <Box flexDirection="column" flexShrink={0}>
    {Array.from({length: lines}, (_, i) => (
      <Text key={i}> </Text>
    ))}
  </Box>
)

type AppProps = {
  initialThemeMode?: ThemeMode
}

export function App({initialThemeMode = 'auto'}: AppProps) {
  return (
    <ThemeProvider mode={initialThemeMode}>
      <AppContent />
    </ThemeProvider>
  )
}

function AppContent() {
  const theme = useTheme()
  const {exit} = useApp()
  const {stdout} = useStdout()
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>({name: 'input'})
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80
  const rows = stdout?.rows && stdout.rows > 1 ? stdout.rows : 24
  const boxWidth = Math.max(14, Math.min(64, columns - 6))
  const contentWidth = Math.max(10, columns - 4)

  const useDualColumn = columns >= 90 && phase.name === 'results' && phase.results.length > 8
  const panelWidth = useDualColumn ? Math.floor(contentWidth * 0.5) : contentWidth
  const infoWidth = useDualColumn ? contentWidth - panelWidth - 3 : 0
  const maxVisible = Math.max(4, rows - 14)

  // Keep selected item visible in scroll window
  useEffect(() => {
    if (phase.name !== 'results') return
    if (selectedIndex < scrollOffset) setScrollOffset(selectedIndex)
    if (selectedIndex >= scrollOffset + maxVisible) setScrollOffset(selectedIndex - maxVisible + 1)
  }, [selectedIndex, maxVisible, phase.name])

  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setPhase({name: 'searching'})
    try {
      const results = await searchTMDB(trimmed)
      if (results.length === 0) {
        setPhase({name: 'empty', query: trimmed})
      } else {
        setSelectedIndex(0)
        setScrollOffset(0)
        setPhase({name: 'results', results, query: trimmed})
      }
    } catch (err) {
      setPhase({name: 'error', message: err instanceof Error ? err.message : String(err)})
    }
  }, [])

  const handleWatch = useCallback(async (result: MediaResult, results: MediaResult[], query: string) => {
    const title = mediaTitle(result)
    setPhase({name: 'watching', title, results, query})
    try {
      await ensurePlayerRunning()
      const url = getPlayerUrl(result)
      await open(url)
      setTimeout(() => {
        setPhase(prev => {
          if (prev.name === 'watching') return {name: 'results', results: prev.results, query: prev.query}
          return prev
        })
      }, 1500)
    } catch (err) {
      setPhase({name: 'error', message: err instanceof Error ? err.message : String(err)})
    }
  }, [])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
      return
    }

    if (phase.name === 'error') {
      if (key.escape || key.return) setPhase({name: 'input'})
      return
    }

    if (phase.name === 'results') {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1))
        return
      }
      if (key.downArrow) {
        setSelectedIndex(i => Math.min(phase.results.length - 1, i + 1))
        return
      }
      if (key.pageUp) {
        setSelectedIndex(i => Math.max(0, i - maxVisible))
        return
      }
      if (key.pageDown) {
        setSelectedIndex(i => Math.min(phase.results.length - 1, i + maxVisible))
        return
      }
      if (key.home) {
        setSelectedIndex(0)
        return
      }
      if (key.end) {
        setSelectedIndex(phase.results.length - 1)
        return
      }
      if (key.escape) {
        setPhase({name: 'input'})
        return
      }
      if (key.return) {
        const r = phase.results[selectedIndex]
        if (r) void handleWatch(r, phase.results, phase.query)
        return
      }
    }

    if (phase.name === 'empty') {
      if (key.escape || key.return) setPhase({name: 'input'})
      return
    }

    if (phase.name === 'watching') return
  })

  const handleSubmit = (value: string) => {
    void handleSearch(value)
  }

  const hints: Array<[string, string]> = (() => {
    switch (phase.name) {
      case 'input':
        return [['↵', 'search'], ['^c', 'quit']]
      case 'searching':
        return [['esc', 'cancel'], ['^c', 'quit']]
      case 'results':
        return [['↑↓', 'choose'], ['pg', 'scroll'], ['↵', 'watch'], ['esc', 'back'], ['^c', 'quit']]
      case 'empty':
        return [['↵', 'search again'], ['esc', 'back'], ['^c', 'quit']]
      case 'watching':
        return [['esc', 'back'], ['^c', 'quit']]
      case 'error':
        return [['↵', 'try again'], ['^c', 'quit']]
    }
  })()

  return (
    <FullScreen>
      <Logo />
      <Gap />
      <Text color={theme.primary}>{TAGLINE}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>movies · series · animation · docs</Text>
      <Gap />

      {phase.name === 'input' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title="Search any movie or series" width={boxWidth}>
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={handleSubmit}
              placeholder="Inception, Breaking Bad, Dune…"
              width={boxWidth - 6}
            />
          </FramedInput>
          {phase.warning ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>× {phase.warning}</Text>
          ) : (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>↵ to search</Text>
          )}
        </Box>
      )}

      {phase.name === 'searching' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title="Search any movie or series" width={boxWidth} buttonDim>
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              {query.length > boxWidth - 8 ? `${query.slice(0, boxWidth - 9)}…` : query}
            </Text>
          </FramedInput>
          <Gap />
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            <Spinner type="dots" /> searching…
          </Text>
        </Box>
      )}

      {phase.name === 'results' && (
        <Box width={contentWidth} flexDirection={useDualColumn ? 'row' : 'column'}>
          {useDualColumn && (
            <Box flexDirection="column" width={infoWidth} paddingRight={3} paddingTop={1}>
              {phase.results[selectedIndex] && (() => {
                const r = phase.results[selectedIndex]!
                return (
                  <>
                    {wrapText(mediaTitle(r), Math.max(10, infoWidth - 4)).map((line, i) => (
                      <Text key={i} bold color={theme.primary}>{line}</Text>
                    ))}
                    <Gap />
                    <Text color={theme.gray} dimColor={theme.dimSecondary}>
                      ▸ {mediaType(r)}{r.vote_average ? ` · ${r.vote_average.toFixed(1)}` : ''}{r.release_date || r.first_air_date ? ` · ${(r.release_date || r.first_air_date)!.slice(0, 4)}` : ''}
                    </Text>
                    {r.overview && (
                      <>
                        <Gap />
                        {wrapText(truncate(r.overview, 200), Math.max(10, infoWidth - 4)).slice(0, 5).map((line, i) => (
                          <Text key={i} color={theme.gray} dimColor={theme.dimSecondary}>{line}</Text>
                        ))}
                      </>
                    )}
                  </>
                )
              })()}
            </Box>
          )}
          <Box flexDirection="column" width={useDualColumn ? panelWidth : contentWidth} paddingTop={1}>
            {!useDualColumn && phase.results[selectedIndex] && (() => {
              const r = phase.results[selectedIndex]!
              return (
                <Box marginBottom={1} flexDirection="column">
                  {wrapText(mediaTitle(r), Math.max(10, contentWidth - 4)).map((line, i) => (
                    <Text key={i} bold color={theme.primary}>{line}</Text>
                  ))}
                  <Text color={theme.gray} dimColor={theme.dimSecondary}>
                    ▸ {mediaType(r)}{r.vote_average ? ` · ${r.vote_average.toFixed(1)}` : ''}{r.release_date || r.first_air_date ? ` · ${(r.release_date || r.first_air_date)!.slice(0, 4)}` : ''}
                  </Text>
                </Box>
              )
            })()}
            <Box flexDirection="column" borderStyle="round" borderColor={theme.gray} borderDimColor={theme.dimSecondary} borderTop={false} borderBottom={false} borderLeft={false} borderRight={false} paddingX={1} paddingTop={0} paddingBottom={0}>
              <Text color={theme.gray} dimColor={theme.dimSecondary}>
                {'╭─ Results ' + '─'.repeat(Math.max(0, (useDualColumn ? panelWidth : contentWidth) - 14)) + '╮'}
              </Text>
              {phase.results.slice(scrollOffset, scrollOffset + maxVisible).map((r, i) => {
                const absoluteIndex = scrollOffset + i
                const isSelected = absoluteIndex === selectedIndex
                const rowWidth = (useDualColumn ? panelWidth : contentWidth) - 4
                const title = truncate(mediaTitle(r), Math.max(10, rowWidth - 22))
                const year = mediaYear(r)
                const type = mediaType(r)
                const indicator = isSelected ? '›' : ' '
                const pad = Math.max(0, rowWidth - title.length - year.length - type.length - 6)
                return (
                  <Text key={r.id} color={isSelected ? theme.primary : theme.gray} dimColor={!isSelected && theme.dimSecondary} bold={isSelected}>
                    {indicator} {title}{' '.repeat(pad)}{year} {type}
                  </Text>
                )
              })}
              {phase.results.length > maxVisible && (
                <Text color={theme.gray} dimColor={theme.dimSecondary}>
                  {scrollOffset > 0 ? '  ↑ more above' : ''}
                  {scrollOffset + maxVisible < phase.results.length ? '  ↓ more below' : ''}
                </Text>
              )}
              <Text color={theme.gray} dimColor={theme.dimSecondary}>
                {'╰' + '─'.repeat(Math.max(0, (useDualColumn ? panelWidth : contentWidth) - 4)) + '╯'}
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {phase.name === 'empty' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            × no results for <Text color={theme.primary}>"{truncate(phase.query, 40)}"</Text>
          </Text>
          <Gap />
          <Text color={theme.gray} dimColor={theme.dimSecondary}>check the spelling or try another title.</Text>
        </Box>
      )}

      {phase.name === 'watching' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.primary}>
            <Spinner type="dots" />
          </Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}> opening {truncate(phase.title, 30)} in browser…</Text>
        </Box>
      )}

      {phase.name === 'error' && (
        <Box flexDirection="column" alignItems="center">
          <Text bold color={theme.primary}>× {phase.message}</Text>
        </Box>
      )}

      <Gap lines={2} />
      <Shortcuts items={hints} />
    </FullScreen>
  )
}
