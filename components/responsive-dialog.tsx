"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  contentClassName?: string
}

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
        <AnimatePresence>
          {dialogOpen && (
        <DialogContent className={cn("sm:max-w-[425px]", contentClassName)}>
          <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              {footer}
            </div>
          )}
          </motion.div>
        </DialogContent>
        )}
        </AnimatePresence>
      </Dialog>
    )
  }

  return (
    <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="max-h-[90vh] z-[60]">
        <DrawerHeader className="text-left px-4 py-6 border-b">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="text-sm text-muted-foreground mt-1">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 relative z-[70]">
          {children}
        </div>
        {footer && (
          <DrawerFooter className="px-4 py-4 border-t bg-muted/50">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}