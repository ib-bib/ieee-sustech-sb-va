"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "./ui/select";

interface MeetingDialogProps {
  meeting: any;
  open: boolean;
  onSave: (data: any) => void;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDialog({
  open,
  meeting,
  onSave,
  onOpenChange,
}: MeetingDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusValue = watch("status") || "";

  const onSubmit = handleSubmit((data: any) => {
    setIsSubmitting(true);
    onSave({
      title: data.title,
      description: data.description,
      date: data.date,
      meetLink: data.meetLink,
      status: data.status,
    });
  });

  const handleCancel = () => {
    reset();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "Add Meeting"}</DialogTitle>
          <DialogDescription>
            {meeting
              ? "Update the meeting details below."
              : "Fill out the form to create a new meeting."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
                placeholder="e.g., Weekly Team Meeting"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Meeting agenda or notes..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={statusValue}
                onValueChange={(val) => setValue("status", val)}
              >
                <SelectTrigger className="w-full" disabled={isSubmitting}>
                  <SelectValue placeholder="Scheduled, Started...etc." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="started">Started</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date & Time *</Label>
              <Input
                id="date"
                type="datetime-local"
                {...register("date", { required: "Date is required" })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetLink">Google Meet Link</Label>
              <Input
                id="meetLink"
                type="url"
                {...register("meetLink")}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Optional: Add the Google Meet link to enable attendance tracking
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
