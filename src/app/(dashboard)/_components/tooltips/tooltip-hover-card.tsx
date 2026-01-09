import { FileScan } from 'lucide-react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import React from 'react'

interface TooltipHoverCardProps {
  children: React.ReactNode
}

const TooltipHoverCard:React.FC<TooltipHoverCardProps> = ({ children }) => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div 
          className="flex items-center justify-center rounded-full p-2 border hover:border-white transition-all"
        >
          <FileScan className='w-4 h-4' />
        </div>
      </HoverCardTrigger>
      <HoverCardContent>
        {/* <div className='space-y-2'>
          <img
            src='https://lp-cms-production.imgix.net/2021-01/GettyRF_450207051.jpg?width=232'
            alt='Content image'
            className='w-full rounded'
          />
          <div className='space-y-1'>
            <p className='text-sm font-medium'>About Himalayas</p>
            <p className='text-muted-foreground text-xs'>
              The Great Himalayan mountain ranges in the Indian sub-continent region.{' '}
              <a
                href='https://en.wikipedia.org/wiki/Himalayas'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-foreground flex w-fit underline'
              >
                Read more
                <ChevronRightIcon className='size-4' />
              </a>
            </p>
          </div>
        </div> */}
        {children}
      </HoverCardContent>
    </HoverCard>
  )
}

export default TooltipHoverCard
