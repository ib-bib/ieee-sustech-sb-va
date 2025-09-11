"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { RatingsYearDropdownMenu } from "./ratings_year_dropdown";

type ChartEntry = {
  month: string;
  rating: number;
};

type ChartData = {
  [year: string]: ChartEntry[];
};

export function ChartLineLinear({
  years,
  ratings,
}: {
  years: any[];
  ratings: ChartData;
}) {
  const [selectedYear, setSelectedYear] = useState(years[0].value);

  const chartData: ChartData = ratings;

  const chartConfig = {
    rating: {
      label: "Rating",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked Rating History</CardTitle>
        <CardDescription>
          <RatingsYearDropdownMenu
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            years={years}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData[selectedYear]}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={1}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="rating"
              type="linear"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm"></CardFooter>
    </Card>
  );
}
