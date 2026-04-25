"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SelectGroup } from "@radix-ui/react-select";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export function TeamMemberDialog({
  open,
  onOpenChange,
  member,
}: TeamMemberDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const utils = api.useContext();
  const { data: roles = [], isLoading: rolesLoading } = api.user.roles.useQuery();

  const createUserMutation = api.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      toast.success("User created successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to create user");
    },
  });

  const updateUserMutation = api.user.update.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      toast.success("User updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        name: member.name,
        email: member.email,
        roleId: member.roleId ? String(member.roleId) : "",
        joinDate: member.joinDate
          ? new Date(member.joinDate).toISOString().slice(0, 10)
          : undefined,
      });
      setValue("roleId", member.roleId ? String(member.roleId) : "");
    } else {
      reset({
        name: "",
        email: "",
        roleId: "",
        joinDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [member, reset, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data: any) => {
            const payload = {
              name: data.name,
              email: data.email,
              roleId: Number(data.roleId),
              joinDate: new Date(data.joinDate).toISOString(),
            };
            if (member?.id) {
              updateUserMutation.mutate({ id: member.id, ...payload });
            } else {
              createUserMutation.mutate(payload as any);
            }
          })}
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: true })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Role *</Label>
              <Select
                {...register("roleId", { required: true })}
                onValueChange={(val: string) => setValue("roleId", val)}
                value={watch("roleId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Captain, Deputy, Volunteer...etc." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {rolesLoading ? (
                      <SelectItem value="">Loading...</SelectItem>
                    ) : (
                      roles.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input id="joinDate" type="date" {...register("joinDate")} />
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
            <Button type="submit">{member ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
