"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

export interface MeetingFormData {
  title: string;
  description?: string;
  date: Date;
  meetLink: string;
  status: string;
}

export interface MeetingData {
  id: number;
  title: string | null;
  description: string | null;
  startTime: Date | null;
  meetingCode: string | null;
  status: string | null;
}

interface MeetingDialogProps {
  meeting: MeetingData | null;
  open: boolean;
  onSave: (data: MeetingFormData) => void;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDialog({
  open,
  meeting,
  onSave,
  onOpenChange,
}: MeetingDialogProps) {
  const { control, register, handleSubmit, reset, setValue, watch } = useForm<MeetingFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const statusValue = watch("status") ?? "";

  const onSubmit = handleSubmit((data) => {
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

              <p className="text-xs text-gray-500">
                Optional: Add a description to infrom participants about the
                meeting agenda or any important notes.
              </p>
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
              {/* <Input
                id="date"
                type="datetime-local"
                {...register("date", { required: "Date is required" })}
                disabled={isSubmitting}
              /> */}
              <Controller
                control={control}
                name="date"
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date); // Update the form state
                          setIsCalendarOpen(false); // Close the popover
                        }}
                      // disabled={(date) =>
                      //   date < new Date() || date < new Date("1900-01-01")
                      // }
                      />
                    </PopoverContent>
                  </Popover>
                )}
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
                required
              />
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
