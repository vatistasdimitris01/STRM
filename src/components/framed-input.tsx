import React, {type ReactNode} from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

export function FramedInput({
  title,
  width,
  button,
  buttonDim = false,
  children,
}: {
  title: string
  width: number
  button?: string
  buttonDim?: boolean
  children: ReactNode
}) {
  const theme = useTheme()
  const inner = width - 2
  const tail = Math.max(0, inner - title.length - 3)
  const buttonW = button ? button.length + 4 : 0
  const fillColor = buttonDim ? theme.gray : theme.primary
  return (
    <Box width={width + buttonW}>
      <Box flexDirection="column" width={width}>
        <Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>{'╭─ '}</Text>
          <Text color={theme.primary}>{title}</Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}>{` ${'─'.repeat(tail)}${button ? '─' : '╮'}`}</Text>
        </Text>
        <Box width={width} height={1} overflow="hidden">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>│ </Text>
          <Text color={theme.primary}>{'>'} </Text>
          <Box flexGrow={1} height={1} overflow="hidden">
            {children}
          </Box>
          {button ? null : <Text color={theme.gray} dimColor={theme.dimSecondary}> │</Text>}
        </Box>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{`╰${'─'.repeat(inner)}${button ? '─' : '╯'}`}</Text>
      </Box>
      {button ? (
        <Box flexDirection="column" width={buttonW}>
          <Text bold color={fillColor} dimColor={buttonDim && theme.dimSecondary}>{'▄'.repeat(buttonW)}</Text>
          <Text
            backgroundColor={theme.inverseButton ? undefined : fillColor}
            color={theme.inverseButton ? undefined : theme.dark}
            inverse={theme.inverseButton && !buttonDim}
            dimColor={buttonDim && theme.dimSecondary}
            bold
          >{`  ${button}  `}</Text>
          <Text bold color={fillColor} dimColor={buttonDim && theme.dimSecondary}>{'▀'.repeat(buttonW)}</Text>
        </Box>
      ) : null}
    </Box>
  )
}
