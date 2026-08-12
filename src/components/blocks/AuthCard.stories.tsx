import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, userEvent, within, expect } from 'storybook/test'
import { AuthCard } from './AuthCard'

const meta = {
  title: 'Blocks/AuthCard',
  component: AuthCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  args: {
    onSignIn: fn(),
    onSignUp: fn(),
    onForgot: fn(),
    loading: false,
    error: null,
  },
} satisfies Meta<typeof AuthCard>

export default meta
type Story = StoryObj<typeof meta>

export const SignIn: Story = {}

export const SignUp: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Sign Up' }))
    await userEvent.type(canvas.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(canvas.getByLabelText('Password'), 'secret123')
    await userEvent.type(canvas.getByLabelText('Confirm Password'), 'secret123')
    await userEvent.click(canvas.getByRole('button', { name: 'Create Account' }))
    expect(args.onSignUp).toHaveBeenCalledWith('new@example.com', 'secret123')
  },
}

export const SignInWithError: Story = {
  args: {
    error: 'Invalid login credentials',
  },
}

// Field-level validation: bad email + short password block submit (UIP-4).
export const SignInFieldError: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(canvas.getByLabelText('Password'), '123')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign In' }))
    expect(args.onSignIn).not.toHaveBeenCalled()
    expect(canvas.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(canvas.getByText('Password must be at least 6 characters')).toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const ForgotPassword: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Forgot password?' }))
    await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Send Reset Link' }))
    expect(args.onForgot).toHaveBeenCalledWith('user@example.com')
  },
}

export const CheckEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Forgot password?' }))
    await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Send Reset Link' }))
    expect(canvas.getByText(/Check your email/i)).toBeInTheDocument()
  },
}

// SB 10 story-level viewport: mobile1 = Small mobile 320x568.
export const MobileSignIn: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
}
