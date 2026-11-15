/**
 * @file VirtualList.tsx
 * @description 高性能虚拟滚动列表组件，基于@tanstack/react-virtual
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

export interface VirtualListItem<T = unknown> {
  id: string | number
  data: T
}

interface VirtualListProps<T> {
  items: VirtualListItem<T>[]
  itemHeight?: number | ((index: number) => number)
  overscan?: number
  className?: string
  style?: Record<string, string | number>
  renderItem: (item: VirtualListItem<T>, index: number, style: Record<string, unknown>) => ReactNode
  onScroll?: (scrollOffset: number) => void
  onEndReached?: (distanceFromEnd: number) => void
  endThreshold?: number
  estimateSize?: number
  getKey?: (index: number, item: VirtualListItem<T>) => string | number
  emptyComponent?: ReactNode
  loadingComponent?: ReactNode
  isLoading?: boolean
  header?: ReactNode
  footer?: ReactNode
}

export function VirtualList<T = unknown>({
  items,
  itemHeight = 48,
  overscan = 5,
  className = '',
  style = {},
  renderItem,
  onScroll,
  onEndReached,
  endThreshold = 200,
  estimateSize,
  getKey,
  emptyComponent,
  loadingComponent,
  isLoading = false,
  header,
  footer,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isNearEnd, setIsNearEnd] = useState(false)

  const defaultEstimateSize = typeof itemHeight === 'number' ? itemHeight : estimateSize || 48

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index)
      }
      return defaultEstimateSize
    }, [itemHeight, defaultEstimateSize]),
    overscan,
    getItemKey: getKey ? (index) => getKey(index, items[index]) : undefined,
  })

  const virtualItems = virtualizer.getVirtualItems()

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (onScroll) {
      onScroll(target.scrollTop)
    }

    if (onEndReached && !isLoading) {
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
      if (scrollBottom < endThreshold && !isNearEnd) {
        setIsNearEnd(true)
        onEndReached(scrollBottom)
        setTimeout(() => setIsNearEnd(false), 500)
      }
    }
  }, [onScroll, onEndReached, endThreshold, isLoading, isNearEnd])

  useEffect(() => {
    const element = parentRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const totalHeight = `${virtualizer.getTotalSize()}px`

  if (items.length === 0 && !isLoading) {
    return (
      <div ref={parentRef} className={`virtual-list-container ${className}`} style={{ ...style, overflow: 'auto' }}>
        {emptyComponent || (
          <div className="flex flex-col items-center justify-center py-12" style={{ opacity: 0.5 }}>
            <span>No items</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`virtual-list-container ${className}`}
      style={{
        ...style,
        overflow: 'auto',
        contain: 'strict',
      }}
      data-testid="virtual-list"
    >
      {header && <div className="virtual-list-header">{header}</div>}

      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          if (!item) return null

          const itemStyle: Record<string, unknown> = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
            willChange: 'transform',
          }

          return (
            <div
              key={getKey ? getKey(virtualItem.index, item) : item.id}
              data-index={virtualItem.index}
              style={itemStyle}
              aria-rowindex={virtualItem.index + 1}
            >
              {renderItem(item, virtualItem.index, itemStyle)}
            </div>
          )
        })}
      </div>

      {footer && <div className="virtual-list-footer">{footer}</div>}

      {isLoading && loadingComponent && (
        <div className="virtual-list-loading">
          {loadingComponent}
        </div>
      )}
    </div>
  )
}

export interface DynamicVirtualListProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  measureElement?: (element: Element, entry?: ResizeObserverEntry, instance?: unknown) => number
}

export function DynamicVirtualList<T = unknown>({
  measureElement,
  ...props
}: DynamicVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => props.estimateSize || 48, [props.estimateSize]),
    overscan: props.overscan || 5,
    measureElement,
  })

  const virtualItems = virtualizer.getVirtualItems()

  if (props.items.length === 0 && !props.isLoading) {
    return (
      <div ref={parentRef} className={`dynamic-virtual-list ${props.className}`} style={{ ...props.style, overflow: 'auto' }}>
        {props.emptyComponent || <div className="p-4 text-center opacity-50">No items</div>}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`dynamic-virtual-list ${props.className || ''}`}
      style={{
        ...props.style,
        overflow: 'auto',
        contain: 'strict',
      }}
    >
      {props.header && <div>{props.header}</div>}

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = props.items[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={props.getKey ? props.getKey(virtualItem.index, item) : item.id}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              ref={measureElement as unknown as React.Ref<HTMLDivElement>}
            >
              {props.renderItem(item, virtualItem.index, {})}
            </div>
          )
        })}
      </div>

      {props.footer && <div>{props.footer}</div>}
    </div>
  )
}

export default VirtualList
