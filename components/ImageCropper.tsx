"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] max-w-[430px]">
        <DialogHeader>
          <DialogTitle>Crop Image (Square Only)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
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
            <label className="text-sm font-medium">Zoom</label>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={createCroppedImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                "Crop & Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}