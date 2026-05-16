import React, { useCallback, useMemo } from 'react'

const VirtualList = ({
  items,
  itemHeight,
  overscan = 3,
  containerHeight,
  renderItem,
  onItemsRendered
}) => {
  const [scrollTop, setScrollTop] = React.useState(0)

  const totalHeight = items.length * itemHeight

  const startIndex = useMemo(() => {
    return Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  }, [scrollTop, itemHeight, overscan])

  const endIndex = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    return Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)
  }, [startIndex, containerHeight, itemHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    const result = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({ index: i, item: items[i] })
      }
    }
    return result
  }, [startIndex, endIndex, items])

  const handleScroll = useCallback((e) => {
    const target = e.target
    setScrollTop(target.scrollTop)

    if (onItemsRendered) {
      const visibleStart = Math.floor(target.scrollTop / itemHeight)
      const visibleCount = Math.ceil(target.clientHeight / itemHeight)
      onItemsRendered(visibleStart, visibleStart + visibleCount)
    }
  }, [itemHeight, onItemsRendered])

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default VirtualList