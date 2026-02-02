import { useAuth } from "@/providers/authentication-provider"
import { useEffect, useMemo, useState } from "react";

import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

type ApiObservation = {
    observedAt: string;
    value: { numeric: number };
    unit: { code: string };
};

export const DashboardPage = () => {
    const { user, idToken } = useAuth();

    const [loading, setLoading] = useState<boolean>(true);
    const [observations, setObservations] = useState<ApiObservation[]>([]);

    const fetchData = async () => {
        const res = await fetch(
            'http://localhost:3000/v1/retrieval/history/glucose?limit=50&startDate=2026-01-01&endDate=2026-02-10',
            {
                headers: {
                    'authorization': `Bearer ${idToken || ''}`
                }
            }
        );

        const json = await res.json();
        setObservations((json?.observations || []) as ApiObservation[]);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const data = useMemo(() => {
        return observations
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
            )
            .map((o) => ({
                date: o.observedAt,
                glucose: o.value.numeric,
            }));
    }, [observations]);

    const unit = observations[0]?.unit?.code ?? "mg/dL";

    const chartConfig = {
        glucose: {
            label: `Glucose (${unit})`,
            color: "hsl(var(--chart-1))",
        },
    } as const;

    return (
        <div className="w-full h-full p-6 flex flex-col">
            <p>Hi {user?.email || 'there'},</p>

            <h2 className="font-semibold mt-6">Glucose Over Time</h2>

            {loading && (
                <div className="w-full h-32 bg-gray-200 rounded-md mt-4 animate-pulse" />
            )}

            {!loading && (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <LineChart data={data} margin={{ left: 12, right: 12, top: 10 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={28}
                            tickFormatter={(iso) =>
                                new Date(iso).toLocaleString(undefined, {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            }
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={40}
                        />

                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(iso) =>
                                        new Date(iso).toLocaleString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                    }
                                    formatter={(value) => [`${value} ${unit}`, "Glucose"]}
                                />
                            }
                        />

                        <Line
                            type="monotone"
                            dataKey="glucose"
                            stroke="#ff0000"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ChartContainer>
            )}
        </div>
    )
}