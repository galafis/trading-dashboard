import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Tabs({ tabs, defaultTab, className }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find(t => t.id === activeTab)

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-accent border-accent'
                : 'text-text-muted hover:text-text-secondary border-transparent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {activeContent?.content}
      </div>
    </div>
  )
}
