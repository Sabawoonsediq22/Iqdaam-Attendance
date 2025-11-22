"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageCropper from "./ImageCropper";
import Webcam from "react-webcam";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageUploaderProps {
  onUpload?: (url: string) => void;
  onCrop?: (file: File | null) => void;
  mode?: 'immediate' | 'deferred';
}

export default function ImageUploader({ onUpload, onCrop, mode = 'immediate' }: ImageUploaderProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    facingMode
  };

  const startCamera = useCallback(() => {
    setShowCameraDialog(true);
  }, []);

  const stopCamera = useCallback(() => {
    setShowCameraDialog(false);
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  }, []);

  const capturePhoto = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      // Load screenshot into canvas and crop to square
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
              if (mode === 'deferred' && onCrop) {
                setUploadedUrl(URL.createObjectURL(file));
                onCrop(file);
              }
            }
          }, 'image/jpeg', 0.9);
        }
      };
      img.src = screenshot;
      stopCamera();
    }
  }, [stopCamera, mode, onCrop]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setSelectedImage(url);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropped = async (croppedFile: File) => {
    if (mode === 'deferred' && onCrop) {
      // Just return the cropped file without uploading
      setUploadedUrl(URL.createObjectURL(croppedFile));
      onCrop(croppedFile);
      setShowCropper(false);
      setSelectedImage("");
      return;
    }

    // Original immediate upload behavior - but since we're using react-webcam,
    // we might need to handle upload differently, but keeping for compatibility
    try {
      // Note: Upload logic would need to be implemented if immediate mode is used
      console.warn('Immediate upload mode not fully implemented with react-webcam');
      setShowCropper(false);
      setSelectedImage("");
    } catch (error) {
      console.error('Upload error:', error);
      setShowCropper(false);
      setSelectedImage("");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage("");
  };

  return (
    <div className="space-y-4">
      {!uploadedUrl ? (
        <div className="space-y-3">
          {/* File Input Section */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            Select an image to crop it to square format before uploading
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Image
            src={uploadedUrl}
            alt="Profile picture"
            width={128}
            height={128}
            className="rounded-full object-cover"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUploadedUrl("");
              onUpload?.("");
              onCrop?.(null);
            }}
          >
            Remove Image
          </Button>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        image={selectedImage}
        onCrop={handleCropped}
        onCancel={handleCropCancel}
        open={showCropper}
      />

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="sm:max-w-[400px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative sm:w-64 sm:h-64 w-48 h-48 mx-auto bg-muted rounded-full overflow-hidden">
              <Webcam
                key={facingMode}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button onClick={toggleCamera} variant="outline" size="sm">
                <SwitchCamera className="h-4 w-4 mr-2" />
                 <span className="hidden sm:inline">Switch Camera</span>
              </Button>
              <div className="flex space-x-2">
                <Button onClick={stopCamera} variant="outline">
                  Cancel
                </Button>
                <Button onClick={capturePhoto}>
                  Capture
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}