"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  image: string;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  open: boolean;
  isProcessing?: boolean;
}

export default function ImageCropper({ image, onCrop, onCancel, open, isProcessing = false }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height, x, y } = croppedAreaPixels;

        // Set canvas size to cropped area
        canvas.width = width;
        canvas.height = height;

        // Draw the cropped portion
        ctx?.drawImage(
          img,
          x, y, width, height, // Source rectangle
          0, 0, width, height  // Destination rectangle
        );

        // Convert to WebP blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "profile.webp", { type: "image/webp" });
            onCrop(file);
          }
        }, 'image/webp', 0.9);
      };

      img.src = image;
    } catch (error) {
      console.error('Error creating cropped image:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Escape / overlay / close button all cancel the crop
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Crop the picture to a square. Only the cropped area is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="relative h-64 overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <Label htmlFor="crop-zoom">Zoom</Label>
            <Slider
              id="crop-zoom"
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={createCroppedImage} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              "Crop & Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}