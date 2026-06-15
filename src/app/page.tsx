"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenants } from "@/context/tenant-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, ArrowRight, Lock, Mail, Server } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { tenants, activeTenant, setActiveTenant } = useTenants();
  
  const [email, setEmail] = useState("compliance@company.com");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API authorization and redirect
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden font-sans">
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Branding / Value Proposition */}
        <div className="md:col-span-7 flex flex-col space-y-6 text-left">
          <div className="inline-flex items-center space-x-2.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5 w-fit backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-300">Enterprise Grade Compliance AI</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Automate Legal & <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Compliance Audits
            </span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
            DocuOps AI is a secure, multi-tenant workspace engineered for professional service firms. Map policies, ingest files, and query compliance with state-of-the-art AI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-md">
            {[
              "Automated Regulatory Mapping",
              "Multi-Tenant Secure Partitioning",
              "Interactive Clause Highlighting",
              "Sub-Second AI Policy Auditing",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-sm text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Card */}
        <div className="md:col-span-5">
          <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            
            <CardHeader className="space-y-1 pb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Enterprise Portal</CardTitle>
              <CardDescription className="text-zinc-400">
                Choose your organization and authenticate.
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Select Tenant Workspace
                  </Label>
                  <Select 
                    value={activeTenant.id} 
                    onValueChange={(val) => val && setActiveTenant(val)}
                  >
                    <SelectTrigger id="tenant" className="bg-zinc-950/80 border-zinc-800 text-zinc-100 focus:ring-violet-500/20">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="focus:bg-zinc-800 focus:text-white">
                          <div className="flex items-center space-x-2">
                            <Server className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-950/80 border-zinc-800 pl-10 text-zinc-100 focus-visible:ring-violet-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-950/80 border-zinc-800 pl-10 text-zinc-100 focus-visible:ring-violet-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
                    <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-0" defaultChecked />
                    <span>Single Sign-On (SSO)</span>
                  </label>
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Forgot password?
                  </a>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg shadow-indigo-600/10 border-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Secure Access</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
