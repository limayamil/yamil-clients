'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  content: string;
  maxLength?: number;
  className?: string;
  expandButtonText?: string;
  collapseButtonText?: string;
  showToggleButton?: boolean;
}

export function ExpandableText({
  content,
  maxLength = 150,
  className,
  expandButtonText = "Ver más",
  collapseButtonText = "Ver menos",
  showToggleButton = true
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) {
    return null;
  }

  const shouldTruncate = content.length > maxLength;
  const displayText = isExpanded || !shouldTruncate
    ? content
    : content.slice(0, maxLength).trim() + '...';

  if (!shouldTruncate) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      <div className="whitespace-pre-wrap break-words">
        {displayText}
      </div>
      {showToggleButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 mt-1 text-xs text-brand-600 hover:text-brand-700 hover:bg-transparent font-medium"
        >
          <span className="mr-1">
            {isExpanded ? collapseButtonText : expandButtonText}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}