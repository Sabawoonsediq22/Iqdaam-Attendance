"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  trigger?: React.ReactNode
  footer?: React.ReactNode
  /**
   * Width/size only, from the shared dialog scale
   * (sm:max-w-md | sm:max-w-lg | sm:max-w-xl | sm:max-w-2xl | sm:max-w-4xl).
   * Never pass padding/rounded/shadow here — the primitives own those.
   */
  contentClassName?: string
}

/**
 * One dialog that renders as a Dialog on desktop and a Drawer on mobile.
 * Header / body / footer padding and the inter-section gap come from the
 * `ui/dialog` and `ui/drawer` primitives, so this wrapper only composes them.
 */
export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  title,
  description,
  trigger,
  footer,
  contentClassName,
}: ResponsiveDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const dialogOpen = open !== undefined ? open : internalOpen
  const setDialogOpen = onOpenChange || setInternalOpen

  if (isDesktop) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("sm:max-w-md", contentClassName)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div>{children}</div>
          {footer && <DialogFooter className="border-t pt-4">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <DrawerFooter className="border-t bg-muted/50">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
