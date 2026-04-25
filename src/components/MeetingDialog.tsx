"use client";
import { useEffect } from "react";
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

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: any;
  onSave: (data: any) => void;
}

export function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  onSave,
}: MeetingDialogProps) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (meeting) {
      reset({
        ...meeting,
        date: meeting.date
          ? new Date(meeting.date).toISOString().slice(0, 16)
          : "",
      });
    } else {
      const now = new Date();
      now.setMinutes(0);
      reset({
        title: "",
        description: "",
        date: now.toISOString().slice(0, 16),
        meetLink: "",
      });
    }
  }, [meeting, reset]);

  const onSubmit = (data: any) => {
    onSave({
      ...data,
      date: new Date(data.date).toISOString(),
    });
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: true })}
                placeholder="e.g., Weekly Team Meeting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Meeting agenda or notes..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date & Time *</Label>
              <Input
                id="date"
                type="datetime-local"
                {...register("date", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetLink">Google Meet Link</Label>
              <Input
                id="meetLink"
                {...register("meetLink")}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{meeting ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
