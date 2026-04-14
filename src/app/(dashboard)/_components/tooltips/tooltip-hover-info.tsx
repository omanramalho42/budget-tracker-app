import { InfoIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipHoverInfo = ({ children, text }: { children: React.ReactNode, text: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className='max-w-64 text-pretty'>
        <div className='flex items-center gap-1.5'>
          <InfoIcon className='size-4' />
          <p>{text}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipHoverInfo
