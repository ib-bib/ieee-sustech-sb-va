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

import { api } from "~/trpc/server";

export const CertCard = async () => {
  const { suggestions, general, team, percentage } = await api.cert.getStatus();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex h-96 w-64 flex-col items-center rounded-3xl bg-transparent py-2 shadow-2xl backdrop-blur-xs transition-all hover:-translate-y-5 hover:cursor-pointer">
          <div className="flex h-1/2 w-full flex-col gap-8">
            <h3 className="w-full text-center font-bold">
              Certification Status
            </h3>

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
                  strokeDashoffset={`${100 - Number(percentage)}`}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                  {percentage} %
                </span>
              </div>
            </div>
          </div>
          <div className="flex h-1/2 w-full flex-col items-center justify-end space-y-2 px-2 pb-8 text-center">
            {suggestions.length == 0 && (
              <p className="text-sm">
                Well done! You have earned your certification! 💯🤩
              </p>
            )}
            {suggestions.length == 1 && (
              <p className="text-sm">
                You&apos;re so close! Just one more step left to take! ⏳
              </p>
            )}
            {suggestions.length > 1 &&
              (general.fulfilled.length > 0 || team.fulfilled.length > 0) && (
                <p className="text-sm">Great work! Keep it up! 💪</p>
              )}
            {suggestions.length > 1 &&
              general.fulfilled.length === 0 &&
              team.fulfilled.length === 0 && (
                <p className="text-sm">
                  The road is long ahead, but you&apos;ve got what it takes! 🌄
                </p>
              )}
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="flex max-h-[800px] min-h-[500px] min-w-[300px] flex-col justify-between overflow-y-auto">
        <div className="flex grow flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="text-center">
              Certification Status (Detailed View)
            </DialogTitle>
          </DialogHeader>
          <Card className="flex h-full grow flex-col">
            <CardContent className="flex h-full flex-col gap-4 overflow-hidden pr-2">
              <div className="relative flex size-40 w-full shrink-0 items-center justify-center">
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
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-blue-600 dark:text-blue-500"
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={`${100 - Number(percentage)}`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                  <span className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                    {percentage} %
                  </span>
                </div>
              </div>

              <h3 className="text-muted-foreground text-center font-medium">
                Conditions you&apos;ve already fulfilled
              </h3>

              <div className="max-h-40 flex-grow-0 overflow-y-auto">
                <ul className="list-disc space-y-2 pl-5">
                  {[...general.fulfilled, ...team.fulfilled].map(
                    (fulfilled) => (
                      <li
                        key={fulfilled.id}
                        className="text-sm leading-relaxed break-words"
                      >
                        <span className="font-semibold">
                          {fulfilled.description}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <h3 className="text-muted-foreground text-center font-medium">
                Suggestions on what to do next
              </h3>

              <div className="min-h-0 flex-grow overflow-y-auto">
                <ul className="list-disc space-y-2 pl-5">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="text-sm leading-relaxed break-words"
                    >
                      <span className="font-semibold">
                        {suggestion.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <DialogFooter className="pt-4">
            <div className="flex w-full flex-col items-center justify-center space-y-1 px-4 text-center">
              {suggestions.length === 0 && (
                <p className="text-sm">
                  Well done! You have earned your certification! 💯🤩
                </p>
              )}
              {suggestions.length === 1 && (
                <p className="text-sm">
                  You&apos;re so close! Just one more step left to take! ⏳
                </p>
              )}
              {suggestions.length > 1 &&
                (general.fulfilled.length > 0 || team.fulfilled.length > 0) && (
                  <p className="text-sm">Great work! Keep it up! 💪</p>
                )}
              {suggestions.length > 1 &&
                general.fulfilled.length === 0 &&
                team.fulfilled.length === 0 && (
                  <p className="text-sm">
                    The road is long ahead, but you&apos;ve got what it takes!
                    🌄
                  </p>
                )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
