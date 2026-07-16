import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TagChips } from '../TagChips'

afterEach(cleanup)

describe('TagChips', () => {
  it('renders existing tags as chips', () => {
    render(
      <TagChips
        tags={['Chest', 'Triceps']}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        suggestions={['Chest', 'Triceps', 'Biceps']}
      />,
    )
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
  })

  it('shows close button on each chip', () => {
    render(
      <TagChips
        tags={['Chest']}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        suggestions={[]}
      />,
    )
    const chip = screen.getByText('Chest')
    const removeBtn = chip.parentElement?.querySelector('button')
    expect(removeBtn).toBeInTheDocument()
  })

  it('shows suggestions that match input text', () => {
    render(
      <TagChips
        tags={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        suggestions={['Chest', 'Triceps', 'Biceps']}
        placeholder="Type to search..."
      />,
    )
    const input = screen.getByPlaceholderText('Type to search...')
    fireEvent.change(input, { target: { value: 'tri' } })
    expect(screen.getByText('Triceps')).toBeInTheDocument()
    expect(screen.queryByText('Chest')).not.toBeInTheDocument()
    expect(screen.queryByText('Biceps')).not.toBeInTheDocument()
  })

  it('calls onAdd when clicking a suggestion', () => {
    const onAdd = vi.fn()
    render(
      <TagChips
        tags={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        suggestions={['Chest', 'Triceps']}
        placeholder="Type..."
      />,
    )
    const input = screen.getByPlaceholderText('Type...')
    fireEvent.change(input, { target: { value: 'che' } })
    fireEvent.mouseDown(screen.getByText('Chest'))
    expect(onAdd).toHaveBeenCalledWith('Chest')
  })

  it('calls onRemove when clicking a chip close button', () => {
    const onRemove = vi.fn()
    render(
      <TagChips
        tags={['Chest', 'Triceps']}
        onAdd={vi.fn()}
        onRemove={onRemove}
        suggestions={[]}
      />,
    )
    const buttons = screen.getAllByRole('button', { name: /remove/i })
    fireEvent.click(buttons[1]!)
    expect(onRemove).toHaveBeenCalledWith('Triceps')
  })

  it('removes last tag on Backspace when input is empty', () => {
    const onRemove = vi.fn()
    render(
      <TagChips
        tags={['Chest', 'Triceps']}
        onAdd={vi.fn()}
        onRemove={onRemove}
        suggestions={[]}
        placeholder="type..."
      />,
    )
    const input = screen.getByPlaceholderText('type...')
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onRemove).toHaveBeenCalledWith('Triceps')
  })

  it('does not remove tag on Backspace when input has text', () => {
    const onRemove = vi.fn()
    render(
      <TagChips
        tags={['Chest']}
        onAdd={vi.fn()}
        onRemove={onRemove}
        suggestions={[]}
        placeholder="type..."
      />,
    )
    const input = screen.getByPlaceholderText('type...')
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('renders label when provided', () => {
    render(
      <TagChips
        tags={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        suggestions={[]}
        label="Primary Muscles"
      />,
    )
    expect(screen.getByText('Primary Muscles')).toBeInTheDocument()
  })

  it('adds tag on Enter key with trimmed input', () => {
    const onAdd = vi.fn()
    render(
      <TagChips
        tags={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        suggestions={['Chest', 'Triceps']}
        placeholder="type..."
      />,
    )
    const input = screen.getByPlaceholderText('type...')
    fireEvent.change(input, { target: { value: 'Chest' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith('Chest')
  })

  it('does not add duplicate tags', () => {
    const onAdd = vi.fn()
    render(
      <TagChips
        tags={['Chest']}
        onAdd={onAdd}
        onRemove={vi.fn()}
        suggestions={['Chest']}
        placeholder="type..."
      />,
    )
    const input = screen.getByPlaceholderText('type...')
    fireEvent.change(input, { target: { value: 'Chest' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).not.toHaveBeenCalled()
  })
})
