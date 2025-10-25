import * as React from 'react'
import cn from 'classnames'

type Item = {
  id: string
  title: React.ReactNode
  content: React.ReactNode
}

type AccordionProps = {
  items: Item[]
  defaultOpenId?: string
  className?: string
}

export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = React.useState<string | undefined>(defaultOpenId)

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = item.id === openId
        return (
          <div key={item.id} className="accordion-item">
            <button className="accordion-header w-full" onClick={() => setOpenId(isOpen ? undefined : item.id)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.title}</span>
                <span className={cn('transition-transform', { 'rotate-180': isOpen })}>▾</span>
              </div>
            </button>
            {isOpen ? <div className="accordion-content">{item.content}</div> : null}
          </div>
        )
      })}
    </div>
  )
}





