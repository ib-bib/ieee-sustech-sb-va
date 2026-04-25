import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Calendar, TrendingUp, AlertCircle, Award } from "lucide-react";
import Link from "next/link";

export default function HROverview() {
  // Mock data - replace with actual API calls
  const stats = {
    totalMembers: 45,
    totalMeetings: 12,
    memberStats: [
      { name: "John Doe", rating: 9.2, totalFlags: 0, attendanceRate: 95 },
      { name: "Jane Smith", rating: 8.8, totalFlags: 1, attendanceRate: 90 },
      // Add more mock data
    ],
  };

  const topPerformers = stats.memberStats
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const recentFlags = stats.memberStats
    .filter((m) => m.totalFlags > 0)
    .sort((a, b) => b.totalFlags - a.totalFlags)
    .slice(0, 5);

  const risingStars = stats.memberStats
    .filter((m) => m.rating >= 8 && m.totalFlags <= 1 && m.attendanceRate >= 80)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const needsAttention = stats.memberStats
    .filter((m) => m.rating < 6)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          HR Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Welcome to the IEEE Student Branch HR Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <Link
              href="/hr/team"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              View all members →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <Link
              href="/hr/meetings"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              View all meetings →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Analytics
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <Link
              href="/hr/analytics"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              View analytics →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Recent Flags */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {member.rating}/10
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Recent Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFlags.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-sm text-red-600">
                    {member.totalFlags} flags
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rising Stars and Needs Attention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Rising Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risingStars.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-sm text-green-600">
                    {member.rating}/10
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsAttention.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-sm text-orange-600">
                    {member.rating}/10
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
