import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/api.js'
import MfaPanel from './MfaPanel.jsx'

const { toDataURL } = vi.hoisted(() => ({ toDataURL: vi.fn() }))
vi.mock('qrcode', () => ({ default: { toDataURL } }))
vi.mock('../../api/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const off = { enabled: false, recoveryCodesRemaining: 0 }
const on = { enabled: true, enabledAt: '2026-11-10T08:00:00Z', recoveryCodesRemaining: 8 }
const codes = ['AAAAA-BBBBB', 'CCCCC-DDDDD', 'EEEEE-FFFFF', 'GGGGG-HHHHH', 'JJJJJ-KKKKK', 'LLLLL-MMMMM', 'NNNNN-PPPPP', 'QQQQQ-RRRRR']
const setupAnswer = { secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', otpauthUrl: 'otpauth://totp/Executive%20Cars:a%40b.test?secret=JBSWY3DPEHPK3PXP' }

beforeEach(() => {
  vi.resetAllMocks()
  toDataURL.mockResolvedValue('data:image/png;base64,QRDATA')
  api.get.mockResolvedValue({ data: off })
})

// Required fields carry a trailing asterisk in their label, so match on the start of it.
const type = (label, value) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } })

describe('MfaPanel when it is off', () => {
  it('explains the risk and offers to turn it on', async () => {
    render(<MfaPanel />)
    expect(await screen.findByRole('button', { name: 'Turn on two-step sign-in' })).toBeInTheDocument()
    expect(screen.getByText(/Anyone who learns your password could sign in/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/auth/mfa')
  })

  it('walks through password, scan, first code and the one-time recovery codes, then shows it as on', async () => {
    api.post.mockResolvedValueOnce({ data: setupAnswer }).mockResolvedValueOnce({ data: { enabled: true, recoveryCodes: codes } })
    api.get.mockResolvedValueOnce({ data: off }).mockResolvedValueOnce({ data: on })
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step sign-in' }))

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    type('Password', 'admin-pass-123')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText(setupAnswer.secret)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/mfa/setup', { password: 'admin-pass-123' })
    expect(await screen.findByAltText('QR code to scan with your authenticator app')).toHaveAttribute('src', 'data:image/png;base64,QRDATA')
    expect(toDataURL).toHaveBeenCalledWith(setupAnswer.otpauthUrl, expect.objectContaining({ width: 192 }))

    type('6-digit code', '12ab')
    expect(screen.getByLabelText(/^6-digit code/)).toHaveValue('12')
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(screen.getByText('Enter the 6-digit code shown in your app.')).toBeInTheDocument()
    type('6-digit code', '123 456')
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))

    const list = await screen.findByRole('list', { name: 'Recovery codes' })
    expect(api.post).toHaveBeenLastCalledWith('/auth/mfa/enable', { code: '123 456' })
    expect(within(list).getAllByRole('listitem').map(item => item.textContent)).toEqual(codes)
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Copy codes' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(codes.join('\n')))
    expect(await screen.findByText('Copied.')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/I have saved these codes/))
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(await screen.findByText(/since/)).toBeInTheDocument()
    expect(screen.getByText('8 unused recovery codes left.')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Recovery codes' })).not.toBeInTheDocument()
  })

  it('says so when the codes could not be copied', async () => {
    api.post.mockResolvedValueOnce({ data: setupAnswer }).mockResolvedValueOnce({ data: { enabled: true, recoveryCodes: codes } })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, configurable: true })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step sign-in' }))
    type('Password', 'admin-pass-123'); fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByText(setupAnswer.secret)
    type('6-digit code', '123456'); fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    await screen.findByRole('list', { name: 'Recovery codes' })
    fireEvent.click(screen.getByRole('button', { name: 'Copy codes' }))
    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument()
  })

  it('shows a wrong password next to the field and keeps the person on that step', async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { message: 'Your password is not correct.', errors: { password: 'Your password is not correct.' } } } })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step sign-in' }))
    type('Password', 'wrong'); fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Your password is not correct.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a wrong first code next to the code field, and cancel returns to the start', async () => {
    api.post.mockResolvedValueOnce({ data: setupAnswer })
    api.post.mockRejectedValueOnce({ response: { status: 400, data: { message: 'That code is incorrect or has already been used.', code: 'MFA_CODE_INVALID', errors: { code: 'That code is incorrect or has already been used.' } } } })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step sign-in' }))
    type('Password', 'admin-pass-123'); fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByText(setupAnswer.secret)
    type('6-digit code', '000000'); fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(await screen.findByText('That code is incorrect or has already been used.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Turn on two-step sign-in' })).toBeInTheDocument()
  })

  it('still lets the person type the key when the picture cannot be made', async () => {
    toDataURL.mockRejectedValue(new Error('no canvas'))
    api.post.mockResolvedValueOnce({ data: setupAnswer })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on two-step sign-in' }))
    type('Password', 'admin-pass-123'); fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('The picture could not be made. Type the key below into your app instead.')).toBeInTheDocument()
    expect(screen.getByText(setupAnswer.secret)).toBeInTheDocument()
    expect(screen.queryByAltText('QR code to scan with your authenticator app')).not.toBeInTheDocument()
  })

  it('reports a failed load and can retry it', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Could not load the two-step sign-in settings' } } })
    render(<MfaPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the two-step sign-in settings')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'Turn on two-step sign-in' })).toBeInTheDocument()
  })
})

describe('MfaPanel when it is on', () => {
  beforeEach(() => api.get.mockResolvedValue({ data: on }))

  it('shows since when, how many recovery codes are left, and nudges when few remain', async () => {
    render(<MfaPanel />)
    expect(await screen.findByText(/since/)).toBeInTheDocument()
    expect(screen.getByText('8 unused recovery codes left.')).toBeInTheDocument()
    expect(screen.queryByText(/Make new ones soon/)).not.toBeInTheDocument()
  })

  it('nudges when two or fewer recovery codes remain, and says "code" for one', async () => {
    api.get.mockResolvedValue({ data: { ...on, recoveryCodesRemaining: 1 } })
    render(<MfaPanel />)
    expect(await screen.findByText(/1 unused recovery code left\. Make new ones soon\./)).toBeInTheDocument()
  })

  it('makes new recovery codes after the password and a code, and shows them once', async () => {
    api.post.mockResolvedValue({ data: { recoveryCodes: codes } })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Make new recovery codes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Make new codes' }))
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    type('Password', 'admin-pass-123')
    fireEvent.click(screen.getByRole('button', { name: 'Make new codes' }))
    expect(screen.getByText('Enter a code from your app or a recovery code.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    type('Code', '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Make new codes' }))
    expect(await screen.findByRole('list', { name: 'Recovery codes' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/mfa/recovery-codes', { password: 'admin-pass-123', code: '123456' })
  })

  it('turns it off after the password and a code, then shows it as off', async () => {
    api.post.mockResolvedValue({ data: { enabled: false } })
    api.get.mockResolvedValueOnce({ data: on }).mockResolvedValueOnce({ data: off })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }))
    expect(screen.getByText(/Your other devices will be signed out/)).toBeInTheDocument()
    type('Password', 'admin-pass-123'); type('Code', 'abcde-fghjk')
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(await screen.findByRole('button', { name: 'Turn on two-step sign-in' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/mfa/disable', { password: 'admin-pass-123', code: 'abcde-fghjk' })
  })

  it('keeps it on and shows the reason when the code is refused', async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { message: 'That code is incorrect or has already been used.', code: 'MFA_CODE_INVALID', errors: { code: 'That code is incorrect or has already been used.' } } } })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }))
    type('Password', 'admin-pass-123'); type('Code', '000000')
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(await screen.findByText('That code is incorrect or has already been used.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText(/since/)).toBeInTheDocument()
  })

  it('shows any other failure as a page-level error', async () => {
    api.post.mockRejectedValue({ response: { status: 500, data: { message: 'Could not turn off two-step sign-in' } } })
    render(<MfaPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }))
    type('Password', 'admin-pass-123'); type('Code', '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not turn off two-step sign-in')
  })
})
