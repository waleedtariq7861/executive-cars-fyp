import { describe, expect, it } from 'vitest'
import { passwordGuidance, passwordProblem } from './password.js'

describe('passwordProblem', () => {
  it('enforces 8 to 128 characters, counting characters not bytes', () => {
    expect(passwordProblem('short1')?.code).toBe('PASSWORD_TOO_SHORT')
    expect(passwordProblem('日本語のパスワード')).toBeNull()
    expect(passwordProblem('日本語')?.code).toBe('PASSWORD_TOO_SHORT') // 9 bytes, 3 characters
    expect(passwordProblem('a1'.repeat(64))).toBeNull()
    expect(passwordProblem(`${'a1'.repeat(64)}x`)?.code).toBe('PASSWORD_TOO_LONG')
  })

  it('has no composition rules', () => {
    expect(passwordProblem('alllowercaseletters')).toBeNull()
    expect(passwordProblem('correct horse battery staple')).toBeNull()
  })

  it('rejects passwords built from the email, the name or the site name', () => {
    const context = { email: 'waleed.tariq@example.com', name: 'Waleed Tariq' }
    expect(passwordProblem('waleedtariq-2026', context)?.code).toBe('PASSWORD_CONTAINS_PERSONAL')
    expect(passwordProblem('MyWaleed!Pass', context)?.code).toBe('PASSWORD_CONTAINS_PERSONAL')
    expect(passwordProblem('lucky-executive-cars-9', context)?.code).toBe('PASSWORD_CONTAINS_PERSONAL')
    expect(passwordProblem('orchid-lantern-42', context)).toBeNull()
    expect(passwordProblem('alibaba-orchid-lantern', { name: 'Ali Raza' })).toBeNull()
  })
})

describe('passwordGuidance', () => {
  it('counts down the missing characters and then confirms the length', () => {
    expect(passwordGuidance('').tone).toBe('neutral')
    expect(passwordGuidance('abc').text).toBe('5 more characters needed.')
    expect(passwordGuidance('abcdefg').text).toBe('1 more character needed.')
    expect(passwordGuidance('orchid-lantern-42').tone).toBe('good')
  })

  it('warns when the password echoes personal details', () => {
    const guidance = passwordGuidance('waleedtariq-2026', { name: 'Waleed Tariq' })
    expect(guidance.tone).toBe('warning')
    expect(guidance.text).toMatch(/name/i)
  })
})
