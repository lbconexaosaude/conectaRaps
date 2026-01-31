import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#003366'];
const SEX_COLORS = ['#003366', '#00AEEF'];

// Pie Chart for Sex
export const GenderPieChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={SEX_COLORS[index % SEX_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Bar Chart for Age
export const AgeBarChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'transparent' }} />
        <Legend />
        <Bar dataKey="value" fill="#ED1C24" radius={[4, 4, 0, 0]} name="Pacientes" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Doughnut for Zones
export const ZoneChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Horizontal Bar for Neighborhoods
export const NeighborhoodsChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" fontSize={12} />
        <YAxis type="category" dataKey="name" fontSize={10} width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#003366" radius={[0, 4, 4, 0]} name="Pacientes" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Line Chart for Weekly/Monthly
export const TrendChart: React.FC<{ data: { name: string, value: number }[], color: string }> = ({ data, color }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Volume" />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Radar Chart for Clinical Indicators
export const ClinicalRadarChart: React.FC<{ data: { subject: string, A: number, fullMark: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" fontSize={12} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
        <Radar
          name="Indicador %"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// --- NEW CHARTS ---

// Medication Adherence Bar Chart
export const MedicationChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#FF8042" radius={[4, 4, 0, 0]} name="Pacientes" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Support Network Chart
export const SupportChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" fontSize={12} />
        <YAxis type="category" dataKey="name" fontSize={12} width={100} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]} name="Pacientes" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Diagnosis Status Pie Chart
export const DiagnoseChart: React.FC<{ data: { name: string, value: number }[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 0 ? '#0088FE' : '#FF8042'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};
