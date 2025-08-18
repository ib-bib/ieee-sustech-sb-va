"use server";

import {
  Dialog,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "~/components/ui/dialog";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { api } from "~/trpc/server";
import { ChartLineLinear } from "~/app/_components/ratings_line_chart";

export default async function RatingsCard() {
  const { value } = await api.rating.getAverageRating();
  const avg_rating = Number(value)

  const radius = 15;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex h-96 w-64 flex-col items-center justify-between rounded-3xl bg-transparent py-2 shadow-2xl backdrop-blur-xs transition-all hover:-translate-y-5 hover:cursor-pointer">
          <div className="flex h-1/2 w-full flex-col gap-8">
            <h3 className="w-full text-center font-bold">Your Ratings</h3>
            <div className="flex w-full flex-col items-center justify-center gap-6">
              <div className="flex w-full flex-col items-center gap-1">
                <p>Last month's rating</p>
                <div className="relative size-28">
                  <svg
                    className="size-full -rotate-90"
                    viewBox="0 0 36 36" // same proportions as big circle
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      className="stroke-current text-gray-200 dark:text-neutral-700"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      className="stroke-current text-blue-600 dark:text-blue-500"
                      strokeWidth="1.5"
                      strokeDasharray={"100"}
                      strokeDashoffset={`${100 - avg_rating}`}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-500">
                      {avg_rating} %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-center gap-1">
                <p>Average Rating</p>
                <div className="relative size-28">
                  <svg
                    className="size-full -rotate-90"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      className="stroke-current text-gray-200 dark:text-neutral-700"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r={radius}
                      fill="none"
                      className="stroke-current text-blue-600 dark:text-blue-500"
                      strokeWidth="1.5"
                      strokeDasharray="100"
                      strokeDashoffset={`${100 - avg_rating}`}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-500">
                      {avg_rating} %
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="flex w-full items-center justify-center gap-6"></div> */}
          </div>
          <div className="flex h-1/2 w-full flex-col items-center justify-end space-y-2 px-2 pb-4 text-center"></div>
        </div>
      </DialogTrigger>
      <DialogContent className="flex h-[600px] min-w-[300px] flex-col justify-between">
        <div className="flex grow flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="text-center">
              Your Flags (Detailed View)
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="current" className="flex grow flex-col">
            <TabsList className="mt-0 mb-2 w-full">
              <TabsTrigger value="current">Current Rating</TabsTrigger>
              <TabsTrigger value="history">Your Rating History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="flex h-full grow flex-col">
              <Card className="flex h-full grow flex-col">
                <CardContent className="flex h-[200px] flex-col gap-4 pr-2">
                  <div className="relative flex size-40 w-full items-center justify-center">
                    <svg
                      className="size-full -rotate-90"
                      viewBox="0 0 36 36"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-current text-gray-200 dark:text-neutral-700"
                        strokeWidth="2"
                      ></circle>
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-current text-blue-600 dark:text-blue-500"
                        strokeWidth="2"
                        strokeDasharray="100"
                        strokeDashoffset={`${100 - avg_rating}`}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                      <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                        {avg_rating} %
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center items-center">
                    {avg_rating <= 70 ?
                      "You can do better 💪" : avg_rating <= 79 ? "Good work, keep rising upwards 📈" : avg_rating <= 89 ? "Great work! Keep it up 😃" : "Well Done! Fantastic work 🤩"}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="flex h-full grow flex-col">
              <Card className="flex h-full grow flex-col">
                <CardContent className="flex flex-col max-h-[400px] gap-4 overflow-y-auto pr-2">
                  <ChartLineLinear />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col items-center justify-center px-4 text-center">
            Make sure you stay above 75% every month to maintain a good track
            record
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
