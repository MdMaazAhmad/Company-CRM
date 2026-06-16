"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  New: "#1B5FA0",
  Contacted: "#5B43A8",
  "Follow-up": "#92610F",
  Quoted: "#C2540A",
  Negotiating: "#B02E4C",
  Converted: "#46720F",
  Dropped: "#7C828A",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
    "Not started": "#1B5FA0",
    "In progress": "#C2540A",
    Review: "#B02E4C",
    Live: "#46720F",
    "On hold": "#7C828A",
  };

  const inrShort = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000
      ? `₹${(n / 1000).toFixed(0)}k`
      : `₹${n}`;

type ChartDatum = { name: string; value: number };

export function PipelineBar({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
      <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#9AA0A8" }}
          axisLine={{ stroke: "#E6E8EC" }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9AA0A8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#F2F4F6" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E6E8EC",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#FF6B00"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SourceDonut({ data }: { data: ChartDatum[] }) {
  const PALETTE = [
    "#FF6B00",
    "#1B5FA0",
    "#46720F",
    "#5B43A8",
    "#C2540A",
    "#7C828A",
  ];

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-faint">
        No source data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E6E8EC",
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#5C636B" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProjectStatusBar({ data }: { data: ChartDatum[] }) {
    const empty = data.every((d) => d.value === 0);
    if (empty) {
      return (
        <div className="flex h-[260px] items-center justify-center text-sm text-faint">
          No projects yet
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9AA0A8" }}
            axisLine={{ stroke: "#E6E8EC" }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9AA0A8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#F2F4F6" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E6E8EC",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={PROJECT_STATUS_COLORS[d.name] ?? "#FF6B00"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  export function RevenueBar({
    data,
  }: {
    data: { name: string; collected: number; outstanding: number }[];
  }) {
    if (data.length === 0) {
      return (
        <div className="flex h-[260px] items-center justify-center text-sm text-faint">
          No revenue data yet
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9AA0A8" }}
            axisLine={{ stroke: "#E6E8EC" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={inrShort}
            tick={{ fontSize: 11, fill: "#9AA0A8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#F2F4F6" }}
            formatter={(v) => "₹" + Number(v ?? 0).toLocaleString("en-IN")}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E6E8EC",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#5C636B" }}
          />
          <Bar
            dataKey="collected"
            name="Collected"
            stackId="rev"
            fill="#46720F"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="outstanding"
            name="Outstanding"
            stackId="rev"
            fill="#C2540A"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }