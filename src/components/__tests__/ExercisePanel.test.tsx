import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ExercisePanel } from '../ExercisePanel'

afterEach(cleanup)

describe('ExercisePanel', () => {
  // --- backward-compatible existing tests ---

  it('renders exercise name', () => {
    render(<ExercisePanel name="Push Ups" />)
    expect(screen.getByText('Push Ups')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<ExercisePanel name="Push Ups" description="A classic upper body exercise" />)
    expect(screen.getByText('A classic upper body exercise')).toBeInTheDocument()
  })

  it('renders legacy chips when provided', () => {
    render(<ExercisePanel name="Push Ups" chips={['Chest', 'Triceps']} />)
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
  })

  it('shows SVG placeholder when no images', () => {
    render(<ExercisePanel name="Push Ups" />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('does not render chips container when chips is empty', () => {
    render(<ExercisePanel name="Push Ups" chips={[]} />)
    expect(screen.queryByText('Chest')).not.toBeInTheDocument()
  })

  // --- image gallery ---

  it('renders first image as main display', () => {
    render(<ExercisePanel name="Push Ups" images={['img1.jpg', 'img2.jpg']} />)
    const imgs = document.querySelectorAll('img')
    expect(imgs[0]).toHaveAttribute('src', 'img1.jpg')
  })

  it('renders thumbnails when multiple images', () => {
    render(<ExercisePanel name="Push Ups" images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />)
    const imgs = document.querySelectorAll('img')
    // 1 main + 3 thumbnails
    expect(imgs.length).toBe(4)
  })

  it('switches main image on thumbnail click', () => {
    render(<ExercisePanel name="Push Ups" images={['img1.jpg', 'img2.jpg']} />)
    let imgs = document.querySelectorAll('img')
    expect(imgs[0]).toHaveAttribute('src', 'img1.jpg')
    const thumbButtons = screen.getAllByRole('button')
    // thumb buttons are those without text (not the instructions toggle)
    const imgButtons = thumbButtons.filter((b) => b.querySelector('img'))
    expect(imgButtons[1]).toBeDefined()
    fireEvent.click(imgButtons[1]!)
    imgs = document.querySelectorAll('img')
    expect(imgs[0]).toHaveAttribute('src', 'img2.jpg')
  })

  // --- badge row ---

  it('renders category badge', () => {
    render(<ExercisePanel name="Push Ups" category="strength" />)
    expect(screen.getByText('strength')).toBeInTheDocument()
  })

  it('renders difficulty badge', () => {
    render(<ExercisePanel name="Push Ups" difficulty="beginner" />)
    expect(screen.getByText('beginner')).toBeInTheDocument()
  })

  it('renders force badge', () => {
    render(<ExercisePanel name="Push Ups" force="push" />)
    expect(screen.getByText('push')).toBeInTheDocument()
  })

  it('renders mechanic badge', () => {
    render(<ExercisePanel name="Push Ups" mechanic="compound" />)
    expect(screen.getByText('compound')).toBeInTheDocument()
  })

  it('renders all four badges together', () => {
    render(
      <ExercisePanel
        name="Push Ups"
        category="strength"
        difficulty="beginner"
        force="push"
        mechanic="compound"
      />
    )
    expect(screen.getByText('strength')).toBeInTheDocument()
    expect(screen.getByText('beginner')).toBeInTheDocument()
    expect(screen.getByText('push')).toBeInTheDocument()
    expect(screen.getByText('compound')).toBeInTheDocument()
  })

  // --- muscles ---

  it('renders primary muscle chips', () => {
    render(<ExercisePanel name="Push Ups" primaryMuscles={['Chest', 'Triceps', 'Shoulders']} />)
    expect(screen.getByText('Chest')).toBeInTheDocument()
    expect(screen.getByText('Triceps')).toBeInTheDocument()
    expect(screen.getByText('Shoulders')).toBeInTheDocument()
  })

  it('renders secondary muscle chips', () => {
    render(<ExercisePanel name="Push Ups" secondaryMuscles={['Core', 'Lower Back']} />)
    expect(screen.getByText('Core')).toBeInTheDocument()
    expect(screen.getByText('Lower Back')).toBeInTheDocument()
  })

  it('renders primary muscles label', () => {
    render(<ExercisePanel name="Push Ups" primaryMuscles={['Chest']} />)
    expect(screen.getByText('Primary Muscles')).toBeInTheDocument()
  })

  it('renders secondary muscles label', () => {
    render(<ExercisePanel name="Push Ups" secondaryMuscles={['Core']} />)
    expect(screen.getByText('Secondary Muscles')).toBeInTheDocument()
  })

  // --- equipment ---

  it('renders equipment chips', () => {
    render(<ExercisePanel name="Push Ups" equipment={['Body weight', 'Mat']} />)
    expect(screen.getByText('Body weight')).toBeInTheDocument()
    expect(screen.getByText('Mat')).toBeInTheDocument()
  })

  it('renders equipment label', () => {
    render(<ExercisePanel name="Push Ups" equipment={['Body weight']} />)
    expect(screen.getByText('Equipment')).toBeInTheDocument()
  })

  // --- instructions (collapsible) ---

  it('shows collapsed instructions by default', () => {
    render(<ExercisePanel name="Push Ups" instructions={['Step one', 'Step two']} />)
    expect(screen.getByText('Show instructions ▼')).toBeInTheDocument()
    expect(screen.queryByText('Step one')).not.toBeInTheDocument()
    expect(screen.queryByText('Step two')).not.toBeInTheDocument()
  })

  it('expands instructions on click', () => {
    render(<ExercisePanel name="Push Ups" instructions={['Step one', 'Step two']} />)
    fireEvent.click(screen.getByText('Show instructions ▼'))
    expect(screen.getByText('Step one')).toBeInTheDocument()
    expect(screen.getByText('Step two')).toBeInTheDocument()
    expect(screen.getByText('Hide instructions ▲')).toBeInTheDocument()
  })

  it('collapses instructions on second click', () => {
    render(<ExercisePanel name="Push Ups" instructions={['Step one']} />)
    fireEvent.click(screen.getByText('Show instructions ▼'))
    expect(screen.getByText('Step one')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide instructions ▲'))
    expect(screen.queryByText('Step one')).not.toBeInTheDocument()
  })

  it('renders instructions as numbered list', () => {
    render(<ExercisePanel name="Push Ups" instructions={['First step']} />)
    fireEvent.click(screen.getByText('Show instructions ▼'))
    const list = document.querySelector('ol')
    expect(list).toBeInTheDocument()
    expect(list?.className).toContain('list-decimal')
  })

  // --- not-found fallback ---

  it('shows not found fallback when name is empty with exerciseId', () => {
    render(<ExercisePanel name="" exerciseId="ex-999" />)
    expect(screen.getByText('Exercise not found (ID: ex-999)')).toBeInTheDocument()
  })

  it('shows not found fallback without exerciseId', () => {
    render(<ExercisePanel name="" />)
    expect(screen.getByText('Exercise not found')).toBeInTheDocument()
  })

  // --- backward compat: imageUrl ---

  it('uses imageUrl as gallery source when images not provided', () => {
    render(<ExercisePanel name="Push Ups" imageUrl="legacy.jpg" />)
    const imgs = document.querySelectorAll('img')
    expect(imgs[0]).toHaveAttribute('src', 'legacy.jpg')
  })
})
