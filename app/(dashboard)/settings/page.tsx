"use client";

import { useSession } from "next-auth/react";
import { useUser } from "@/components/client-providers";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useTheme } from "@/hooks/use-theme";
import { useState, useRef, useEffect } from "react";
import { User, Mail, Shield, Moon, Sun, Bell, Camera, AlertTriangle, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Loader } from "@/components/loader";
import ImageCropper from "@/components/ImageCropper";
import { generateReactHelpers } from "@uploadthing/react";

const { useUploadThing } = generateReactHelpers();

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { avatar, setAvatar, userData } = useUser();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Avatar change states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(userData?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("imageUploader");


  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const preferences = await response.json();
          setNotifications(preferences.pushNotifications);
          setEmailUpdates(preferences.emailUpdates);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
        // Keep default values if loading fails
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, [session?.user?.id]);

  // Update name when userData loads
  useEffect(() => {
    if (userData?.name) {
      setName(userData.name);
    }
  }, [userData?.name]);

  // Cleanup object URL on unmount or when selectedImage changes
  useEffect(() => {
    return () => {
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;

    const nameChanged = name !== (session.user.name || "");

    // Only update if name changed
    if (!nameChanged) {
      toast.info("No changes to save");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile settings saved successfully!");

      // Update session with new name
      await update({ name });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!session?.user?.id) return;

    setIsSavingPreferences(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pushNotifications: notifications,
          emailUpdates: emailUpdates,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save preferences");
      }

      const data = await response.json();
      toast.success(data.message || "Preferences saved successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session?.user?.id) return;

    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both current and new password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully. You will be signed out.");
      // Sign out and redirect to home page
      signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAvatarChange = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (file: File) => {
    // Create preview URL for the cropped image
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);

    // Upload immediately
    await handleAvatarUpload(file);

    // Close cropper
    setIsCropperOpen(false);
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!session?.user?.id) return;

    setIsUploading(true);
    try {
      // Upload avatar
      const uploadResult = await startUpload([file]);

      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Avatar upload failed");
      }

      const avatarUrl = uploadResult[0].url;

      // Update user profile with new avatar (API will handle deleting old avatar)
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update avatar");
      }

      // Update session
      await update({ image: avatarUrl });

      // Update local avatar state
      setAvatar(avatarUrl);

      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
  };

  if (!session?.user) {
    return <Loader text="Loading settings..." />;
  }


  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6 p-4 rounded-lg bg-muted/30 border">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                <AvatarImage
                  src={selectedImage || avatar || undefined}
                  alt={name || userData?.name || ""}
                />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(name || userData?.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/5 hover:border-primary/20 transition-colors"
                  onClick={handleAvatarChange}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="transition-colors focus:ring-2 focus:ring-primary/20"
                />
              </div>
               
              <Button
              onClick={handleSaveProfile}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg"
            >
              <User className="h-4 w-4 mr-2" />
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />
              updating...
              </>
            ) : "Update name"}
            </Button>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session.user.email || ""}
                    placeholder="Enter your email"
                    disabled
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant={(session?.user as ExtendedUser)?.role === "admin" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {(session?.user as ExtendedUser)?.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Sun className="h-4 w-4 text-primary" />
                    </div>
                    <Label className="text-base font-medium">Theme</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              {(session?.user as ExtendedUser)?.role === "admin" && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-500/10">
                          <Bell className="h-4 w-4 text-blue-600" />
                        </div>
                        <Label className="text-base font-medium">Push Notifications</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about attendance updates
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!preferencesLoaded && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <Switch
                        checked={notifications}
                        onCheckedChange={setNotifications}
                        disabled={!preferencesLoaded || isSavingPreferences}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-green-500/10">
                          <Mail className="h-4 w-4 text-green-600" />
                        </div>
                        <Label className="text-base font-medium">Email Updates</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive email summaries of attendance reports
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!preferencesLoaded && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <Switch
                        checked={emailUpdates}
                        onCheckedChange={setEmailUpdates}
                        disabled={!preferencesLoaded || isSavingPreferences}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {(session?.user as ExtendedUser)?.role === "admin" && (
              <Button
                onClick={handleSavePreferences}
                disabled={isSavingPreferences || !preferencesLoaded}
                className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isSavingPreferences ? "Saving..." : "Save Preferences"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Security */}
      <Card className="border-amber-200/50 ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
             <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
             <div className="relative">
               <Input
                 id="current-password"
                 type={showCurrentPassword ? "text" : "password"}
                 value={currentPassword}
                 onChange={(e) => setCurrentPassword(e.target.value)}
                 placeholder="Enter current password"
                 className="pr-10 transition-colors focus:ring-2 focus:ring-amber-500/20"
               />
               <button
                 type="button"
                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
                 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
               >
                 {showCurrentPassword ? (
                   <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                 ) : (
                   <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                 )}
               </button>
             </div>
           </div>

           <div className="space-y-2">
             <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
             <div className="relative">
               <Input
                 id="new-password"
                 type={showNewPassword ? "text" : "password"}
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="Enter new password"
                 className="pr-10 transition-colors focus:ring-2 focus:ring-amber-500/20"
               />
               <button
                 type="button"
                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
                 onClick={() => setShowNewPassword(!showNewPassword)}
               >
                 {showNewPassword ? (
                   <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                 ) : (
                   <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                 )}
               </button>
             </div>
           </div>
         </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto hover:bg-amber-500/10 hover:border-amber-500/20 transition-colors"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Shield className="h-4 w-4 mr-2" />
            {isChangingPassword ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing...</>
            ) : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 ">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Danger Zone 
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="md:flex flex-col items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(true)}
                className="cursor-pointer mt-3 w-full md:w-auto hover:bg-destructive/90 transition-colors md:ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This action cannot be undone. This will permanently delete your account and You will be immediately signed out and cannot access the system again."
        isDeleting={isDeleting}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          open={isCropperOpen}
          isProcessing={isUploading}
        />
      )}
    </div>
  );
}