"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "~/components/ui/chart"
import { RatingsYearDropdownMenu } from "./ratings_year_dropdown"

export function ChartLineLinear() {
    const [selectedYear, setSelectedYear] = useState("2025")

    type ChartEntry = {
        month: string;
        rating: number;
    };

    type ChartData = {
        [year: string]: ChartEntry[];
    };

    const chartData: ChartData =
    {
        "2025": [
            { month: "January", rating: 86 },
            { month: "February", rating: 67 },
            { month: "March", rating: 73 },
            { month: "April", rating: 79 },
            { month: "May", rating: 90 },
            { month: "June", rating: 83 }
        ],
        "2024": [
            { month: "January", rating: 89 },
            { month: "February", rating: 64 },
            { month: "March", rating: 70 },
            { month: "April", rating: 71 },
            { month: "May", rating: 95 },
            { month: "June", rating: 80 },
        ],
        "2023": [
            { month: "January", rating: 82 },
            { month: "February", rating: 65 },
            { month: "March", rating: 79 },
            { month: "April", rating: 74 },
            { month: "May", rating: 92 },
            { month: "June", rating: 88 },
        ]
    }


    const chartConfig = {
        rating: {
            label: "Rating",
            color: "var(--chart-3)",
        },
    } satisfies ChartConfig


    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracked Rating History</CardTitle>
                <CardDescription>
                    {/* Year {selectedYear} */}
                    <RatingsYearDropdownMenu selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
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
            <CardFooter className="flex-col items-start gap-2 text-sm">
            </CardFooter>
        </Card>
    )
}
