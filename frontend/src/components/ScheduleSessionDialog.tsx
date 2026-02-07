import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Video,
  ExternalLink,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { User } from "../types";
import { Swap } from "../features/swaps/swapsSlice";
import {
  createSession,
  getUserTimezone,
  getTimezoneOptions,
} from "../services/sessionService";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface ScheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onSessionCreated: () => void;
  preselectedSwap?: Swap;
}

export const ScheduleSessionDialog: React.FC<ScheduleSessionDialogProps> = ({
  open,
  onOpenChange,
  currentUser,
  onSessionCreated,
  preselectedSwap,
}) => {
  const { swaps } = useSelector((state: RootState) => state.swaps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to only accepted swaps
  const acceptedSwaps = swaps.filter((swap) => swap.status === "accepted");

  // Form state
  const [formData, setFormData] = useState({
    swapRequestId: preselectedSwap?._id || "",
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    timezone: getUserTimezone(),
    meetingType: "jitsi" as "external" | "jitsi" | "in-person",
    meetingLink: "",
    location: "",
    notes: "",
  });

  // Update form when preselectedSwap changes
  useEffect(() => {
    if (preselectedSwap) {
      setFormData((prev) => ({
        ...prev,
        swapRequestId: preselectedSwap._id,
      }));
    }
  }, [preselectedSwap]);

  // Get the other user for a swap
  const getOtherUser = (swap: Swap): User | null => {
    const fromUser = swap.fromUserId as User;
    const toUser = swap.toUserId as User;
    if (!fromUser || !toUser) return null;
    return fromUser._id === currentUser._id ? toUser : fromUser;
  };

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      swapRequestId: "",
      title: "",
      description: "",
      date: "",
      time: "",
      duration: "60",
      timezone: getUserTimezone(),
      meetingType: "jitsi",
      meetingLink: "",
      location: "",
      notes: "",
    });
    setError(null);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.swapRequestId) {
        throw new Error("Please select a swap");
      }
      if (!formData.title) {
        throw new Error("Please enter a title");
      }
      if (!formData.date || !formData.time) {
        throw new Error("Please select date and time");
      }

      // Find the selected swap to get the guest user ID
      const selectedSwap = acceptedSwaps.find(
        (s) => s._id === formData.swapRequestId,
      );
      if (!selectedSwap) {
        throw new Error("Selected swap not found");
      }

      const otherUser = getOtherUser(selectedSwap);
      if (!otherUser) {
        throw new Error("Could not determine the other participant");
      }

      // Combine date and time into ISO string
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);

      // Create the session
      await createSession({
        swapRequestId: formData.swapRequestId,
        guestUserId: otherUser._id,
        title: formData.title,
        description: formData.description || undefined,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(formData.duration),
        timezone: formData.timezone,
        meetingType: formData.meetingType,
        meetingLink:
          formData.meetingType === "external"
            ? formData.meetingLink
            : undefined,
        location:
          formData.meetingType === "in-person" ? formData.location : undefined,
        notes: formData.notes || undefined,
      });

      resetForm();
      onSessionCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  // Duration options
  const durationOptions = [
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
  ];

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule a Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Swap Selection */}
          <div>
            <Label htmlFor="swapRequestId">Select Swap *</Label>
            <Select
              value={formData.swapRequestId}
              onValueChange={(value) =>
                handleSelectChange("swapRequestId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an accepted swap" />
              </SelectTrigger>
              <SelectContent>
                {acceptedSwaps.length === 0 ? (
                  <SelectItem value="" disabled>
                    No accepted swaps available
                  </SelectItem>
                ) : (
                  acceptedSwaps.map((swap) => {
                    const otherUser = getOtherUser(swap);
                    return (
                      <SelectItem key={swap._id} value={swap._id}>
                        {swap.skillOffered} ⇄ {swap.skillWanted}
                        {otherUser && ` (with ${otherUser.name})`}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {acceptedSwaps.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                You need an accepted swap request before you can schedule a
                session.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., First JavaScript lesson"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What will you cover in this session?"
              rows={2}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                min={today}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Duration and Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => handleSelectChange("duration", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleSelectChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTimezoneOptions().map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <Label>Meeting Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant={
                  formData.meetingType === "jitsi" ? "default" : "outline"
                }
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSelectChange("meetingType", "jitsi")}
              >
                <Video className="w-5 h-5 mb-1" />
                <span className="text-xs">Jitsi Call</span>
                <span className="text-xs text-gray-400">(Free)</span>
              </Button>
              <Button
                type="button"
                variant={
                  formData.meetingType === "external" ? "default" : "outline"
                }
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSelectChange("meetingType", "external")}
              >
                <ExternalLink className="w-5 h-5 mb-1" />
                <span className="text-xs">External Link</span>
                <span className="text-xs text-gray-400">(Zoom, Meet)</span>
              </Button>
              <Button
                type="button"
                variant={
                  formData.meetingType === "in-person" ? "default" : "outline"
                }
                className="flex flex-col items-center py-4 h-auto"
                onClick={() => handleSelectChange("meetingType", "in-person")}
              >
                <MapPin className="w-5 h-5 mb-1" />
                <span className="text-xs">In-Person</span>
                <span className="text-xs text-gray-400">(Location)</span>
              </Button>
            </div>
          </div>

          {/* External Meeting Link */}
          {formData.meetingType === "external" && (
            <div>
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                name="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={handleChange}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
            </div>
          )}

          {/* In-Person Location */}
          {formData.meetingType === "in-person" && (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Central Library, Meeting Room 3"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any other information for the session..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleSessionDialog;
