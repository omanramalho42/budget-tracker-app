import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipHoverPlan = ({ children }: { children: React.ReactNode }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex items-center gap-2'>
          <p>Team plan: $99/month per user.</p>
          <Badge variant='secondary' className='px-1.5 py-px'>
            Trending
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipHoverPlan
