import React from 'react'

import { Skeleton } from './ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonWrapperProps {
    children: React.ReactNode;
    isLoading: boolean;
    fullWidth?: boolean;
}

const SkeletonWrapper = ({ children, isLoading, fullWidth = true }: SkeletonWrapperProps) => {
    if (!isLoading) return children

    return (
        <Skeleton className={cn(fullWidth && "w-full")}>
            <div className={"opacity-0"}>
                { children }
            </div>
        </Skeleton>
    )
}

export default SkeletonWrapper