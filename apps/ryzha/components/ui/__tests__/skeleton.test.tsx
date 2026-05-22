import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton } from '../skeleton'
import { SkeletonCard } from '../skeleton-card'
import { SkeletonTable } from '../skeleton-table'

describe('Skeleton Components', () => {
  it('Skeleton renders correctly', () => {
    const { container } = render(<Skeleton className="w-10 h-10" />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('SkeletonCard renders correctly', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('SkeletonTable renders correctly', () => {
    const { container } = render(<SkeletonTable />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
