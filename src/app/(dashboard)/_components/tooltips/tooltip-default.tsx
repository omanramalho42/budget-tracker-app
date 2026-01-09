import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const TooltipDefault = ({ children, text }: { children: React.ReactNode, text: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className='rounded-full'>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default TooltipDefault
