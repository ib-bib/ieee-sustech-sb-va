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
  const { register } = useForm();

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
        <form onSubmit={onSubmit}>
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
              <Label htmlFor="position">Status *</Label>
              <Select {...register("status", { required: true })}>
                <SelectTrigger className="w-full">
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
                {...register("date", { required: true })}
              />
            </div>
            {/* Disable past selection */}

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
            <Button type="submit" variant="outline">
              Cancel
            </Button>
            <Button className="cursor-pointer" type="submit">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
