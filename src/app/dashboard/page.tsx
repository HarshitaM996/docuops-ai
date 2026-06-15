"use client";

import React from "react";
import Link from "next/link";
import { useTenants } from "@/context/tenant-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, FileText, CheckCircle2, AlertTriangle, ArrowUpRight, TrendingUp, Clock, History } from "lucide-react";

export default function DashboardOverview() {
  const { activeTenant } = useTenants();

  // Determine status color for compliance score
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return "text-emerald-400 stroke-emerald-500";
    if (score >= 75) return "text-amber-400 stroke-amber-500";
    return "text-rose-400 stroke-rose-500";
  };

  const scoreColorClass = getScoreColorClass(activeTenant.complianceScore);

  // Stats counting
  const totalDocs = activeTenant.documents.length;
  const processingDocs = activeTenant.documents.filter((d) => d.status === "Processing").length;
  const indexedDocs = activeTenant.documents.filter((d) => d.status === "Indexed").length;
  const failedDocs = activeTenant.documents.filter((d) => d.status === "Failed").length;

  return (
    <div className="space-y-8 font-sans">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time compliance posture, metrics, and activity logs for {activeTenant.name}.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All systems nominal</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Gauge: Compliance Health Score */}
        <Card className="md:col-span-4 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              Compliance Health Score
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Algorithmic assessment of active documents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 relative">
            {/* SVG Radial Gauge */}
            <div className="relative h-36 w-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  className="stroke-zinc-800"
                  strokeWidth="8"
                  fill="transparent"
                  r="38"
                  cx="50"
                  cy="50"
                />
                {/* Foreground Track */}
                <circle
                  className={`transition-all duration-1000 ease-out ${scoreColorClass}`}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - activeTenant.complianceScore / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  r="38"
                  cx="50"
                  cy="50"
                />
              </svg>
              {/* Score Value Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {activeTenant.complianceScore}%
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                  {activeTenant.complianceScore >= 90 
                    ? "Excellent" 
                    : activeTenant.complianceScore >= 75 
                    ? "Warning" 
                    : "Action Req."}
                </span>
              </div>
            </div>
            
            {/* Health Score Subtext */}
            <p className="text-xs text-zinc-400 text-center mt-4 max-w-[200px]">
              {failedDocs > 0 
                ? `${failedDocs} critical document failed audits. Review required.` 
                : "No critical failures detected. Platform compliant."}
            </p>
          </CardContent>
        </Card>

        {/* Total Documents Count */}
        <Card className="md:col-span-4 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              Document Workspace State
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs font-medium">
              Real-time ingestion funnel details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-extrabold text-white tracking-tight">{totalDocs}</span>
              <span className="text-xs font-medium text-zinc-500 flex items-center space-x-1">
                <span>Active files</span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Indexed & Ready</span>
                </span>
                <span className="text-zinc-200 font-semibold">{indexedDocs}</span>
              </div>
              <Progress value={totalDocs ? (indexedDocs / totalDocs) * 100 : 0} className="h-1 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-xl text-left">
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Processing</span>
                <span className="text-sm font-bold text-indigo-400 flex items-center space-x-1">
                  {processingDocs > 0 && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping mr-1" />}
                  {processingDocs}
                </span>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-xl text-left">
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Failed Audits</span>
                <span className={`text-sm font-bold ${failedDocs > 0 ? "text-rose-400" : "text-zinc-400"}`}>
                  {failedDocs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inline Trend Chart (SVG Line Chart) */}
        <Card className="md:col-span-4 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Ingestion Volume</span>
              <span className="text-[10px] text-indigo-400 flex items-center font-medium capitalize">
                <TrendingUp className="h-3 w-3 mr-1" />
                +14% this week
              </span>
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Compliance scans run per day
            </CardDescription>
          </CardHeader>
          <CardContent className="py-2 flex-1 flex flex-col justify-between">
            {/* SVG Line Graph */}
            <div className="w-full h-24 mt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid line */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#1f1f23" strokeWidth="0.5" />
                <line x1="0" y1="15" x2="100" y2="15" stroke="#1f1f23" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="5" x2="100" y2="5" stroke="#1f1f23" strokeWidth="0.5" />
                
                {/* Area under the line */}
                <path
                  d="M0,25 L0,22 L15,18 L30,23 L45,12 L60,8 L75,14 L90,6 L100,5 L100,25 Z"
                  fill="url(#gradient-chart)"
                />
                
                {/* Chart Line */}
                <path
                  d="M0,22 L15,18 L30,23 L45,12 L60,8 L75,14 L90,6 L100,5"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Hotspots */}
                <circle cx="60" cy="8" r="1.5" className="fill-white stroke-indigo-500" strokeWidth="1" />
                <circle cx="100" cy="5" r="1.5" className="fill-white stroke-indigo-500" strokeWidth="1" />
              </svg>
            </div>
            
            <div className="flex justify-between text-[10px] text-zinc-500 px-1 pt-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Alerts Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left: Recent Alerts Table */}
        <Card className="lg:col-span-8 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white text-lg font-bold">Actionable Policy Violations</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Risks flagged that require legal review
              </CardDescription>
            </div>
            <Link href="/dashboard/documents" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1">
              <span>Manage Documents</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-y border-zinc-900 bg-zinc-900/20 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-6">Detected Issue</th>
                    <th className="py-3 px-6">Severity</th>
                    <th className="py-3 px-6">Age</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {activeTenant.alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                        No policy violations detected. This tenant posture is secure.
                      </td>
                    </tr>
                  ) : (
                    activeTenant.alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-zinc-200 max-w-[150px] truncate">
                          {alert.documentName}
                        </td>
                        <td className="py-4 px-6 text-zinc-400 max-w-[220px] truncate">
                          {alert.message}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`border-0 font-medium px-2 py-0.5 text-[10px] rounded-md ${
                            alert.severity === "high" 
                              ? "bg-rose-500/10 text-rose-400" 
                              : alert.severity === "medium"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {alert.severity}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-zinc-500">
                          {alert.timestamp}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href="/dashboard/assistant">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 font-bold"
                            >
                              Audit Clause
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right: Activity Log */}
        <Card className="lg:col-span-4 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-white text-base font-bold">Activity Feed</CardTitle>
            </div>
            <CardDescription className="text-zinc-500 text-xs">
              Live audit trials & document lifecycles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="relative border-l border-zinc-900 pl-4 ml-2 space-y-5">
              {/* Timeline Item 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-zinc-950" />
                <span className="text-[10px] text-zinc-500 block">Just now</span>
                <span className="text-xs font-semibold text-zinc-200">System Checklist Updated</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Tenant config re-indexed and tenant compliance scores updated.
                </p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-zinc-700 ring-4 ring-zinc-950" />
                <span className="text-[10px] text-zinc-500 block">4 hours ago</span>
                <span className="text-xs font-semibold text-zinc-200">Document Scan Started</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Ingested and initiated scans for compliance triggers.
                </p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-4 ring-zinc-950" />
                <span className="text-[10px] text-zinc-500 block">1 day ago</span>
                <span className="text-xs font-semibold text-zinc-200">Policy Breach Detected</span>
                <p className="text-[11px] text-rose-400 mt-0.5">
                  NDA draft flagged for missing indemnification limitation caps.
                </p>
              </div>

              {/* Timeline Item 4 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
                <span className="text-[10px] text-zinc-500 block">2 days ago</span>
                <span className="text-xs font-semibold text-zinc-200">Document Audit Approved</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Counsel marked GDPR Data Processing Addendum as compliant.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
