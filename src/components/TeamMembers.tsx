"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { TeamMemberDialog } from "./TeamMemberDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

import { api } from "~/trpc/react";

type Member = {
  id: string;
  name: string;
  email: string;
  roleId: number;
  role: string;
  joinDate: string;
  isActive: boolean;
};

export function TeamMembers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const utils = api.useUtils();
  const { data: members = [], isLoading } = api.user.getAll.useQuery();
  const deactivateMutation = api.user.deactivate.useMutation({
    onSuccess: async () => {
      await utils.user.getAll.invalidate();
      toast.success("User deactivated");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: () => toast.error("Failed to deactivate user"),
  });

  const handleDelete = async () => {
    if (!memberToDelete) return;
    try {
      deactivateMutation.mutate({ id: memberToDelete.id });
    } catch (err) {
      console.error(err);
      toast.error("Failed to deactivate team member");
    }
  };

  const filteredMembers = members.filter((member) =>
    [member.name, member.email, member.role]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  if (isLoading) return <div className="py-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Team Members
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Manage your IEEE student branch team
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMember(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                {searchQuery
                  ? "No members found matching your search"
                  : "No team members yet. Add your first member!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/hr/team/${member.id}`}
                      className="block cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                        {member.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-gray-500">{member.role}</p>
                        <span className="hidden text-gray-300 sm:inline">
                          •
                        </span>
                        <p className="truncate text-sm text-gray-500">
                          {member.email}
                        </p>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-2">
                    <div className="text-left sm:mr-4 sm:text-right">
                      <p className="text-xs text-gray-500">
                        Joined{" "}
                        {member.joinDate
                          ? new Date(member.joinDate).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMember({
                            id: member.id,
                            name: member.name ?? "",
                            email: member.email,
                            roleId: member.roleId,
                            role: member.role ?? "",
                            joinDate: member.joinDate ?? "",
                            isActive: member.isActive ?? false,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMemberToDelete({
                            id: member.id,
                            name: member.name ?? "",
                            email: member.email,
                            roleId: member.roleId,
                            role: member.role ?? "",
                            joinDate: member.joinDate ?? "",
                            isActive: member.isActive ?? false,
                          });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {memberToDelete?.name}? This
              will disable the user&apos;s account. This action can be reversed
              by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
