"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useTenants } from "@/context/tenant-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Search, AlertCircle, CheckCircle2, RefreshCw, Eye, Trash2, FileText, ArrowUpDown } from "lucide-react";

export default function DocumentWorkspace() {
  const { activeTenant, addDocument, deleteDocument } = useTenants();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredDocs = activeTenant.documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // Simulate adding the document to the active tenant
      addDocument(file.name, file.size);
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Document Workspace</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Upload legal documents to index clauses, audit compliance risks, and run semantic queries.
        </p>
      </div>

      {/* Grid: Upload Zone and Filter Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Drag & Drop Upload Zone */}
        <Card 
          className={`lg:col-span-12 border-dashed border-2 bg-zinc-900/10 backdrop-blur-md transition-all duration-300 relative overflow-hidden ${
            isDragging 
              ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
              : "border-zinc-800 hover:border-zinc-750 hover:bg-zinc-900/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple 
              className="hidden" 
              accept=".pdf,.docx,.doc,.txt"
            />
            
            <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragging 
                ? "bg-indigo-600 border-indigo-500 text-white" 
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}>
              <UploadCloud className="h-7 w-7" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-sm font-semibold text-zinc-200">
                Drag and drop files here, or{" "}
                <button 
                  onClick={triggerFileSelect} 
                  className="text-indigo-400 hover:text-indigo-300 font-bold focus:outline-none"
                >
                  browse from your local drive
                </button>
              </h3>
              <p className="text-xs text-zinc-500">
                Supports secure PDF, DOCX, and TXT files up to 25MB. All files are fully partitioned and encrypted within your tenant.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Controls & Table */}
        <Card className="lg:col-span-12 border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base font-bold">Workspace Repository</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Management and processing monitor for files in {activeTenant.name}.
            </CardDescription>
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search documents by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 pl-10 text-xs focus-visible:ring-violet-500/20"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                  <SelectTrigger className="bg-zinc-950/80 border-zinc-800 text-zinc-300 text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="indexed">Indexed & Audited</SelectItem>
                    <SelectItem value="failed">Failed Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-y border-zinc-900 bg-zinc-900/20 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-6">Size</th>
                    <th className="py-3 px-6">Uploaded At</th>
                    <th className="py-3 px-6">Indexing Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">
                        No documents found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-4 px-6 flex items-center space-x-3 max-w-[250px] truncate">
                          <div className="h-8 w-8 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-indigo-400 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-semibold text-zinc-200 truncate">{doc.name}</span>
                            <span className="text-[10px] text-zinc-500 block">ID: {doc.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-400 font-medium">{doc.size}</td>
                        <td className="py-4 px-6 text-zinc-500">
                          {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-6">
                          {doc.status === "Processing" && (
                            <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 border-0 font-semibold px-2 py-0.5 text-[10px] rounded-md flex items-center space-x-1.5 w-fit">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Processing (15s)...</span>
                            </Badge>
                          )}
                          
                          {doc.status === "Indexed" && (
                            <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border-0 font-semibold px-2 py-0.5 text-[10px] rounded-md flex items-center space-x-1.5 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Indexed & Scanned</span>
                            </Badge>
                          )}

                          {doc.status === "Failed" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Badge className="bg-rose-500/10 border-rose-500/20 text-rose-400 border-0 font-semibold px-2 py-0.5 text-[10px] rounded-md flex items-center space-x-1.5 w-fit cursor-pointer" />
                                  }
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Failed Check</span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs max-w-xs p-2">
                                  {doc.failReason || "Checking process failed"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2 shrink-0">
                          {doc.status === "Indexed" ? (
                            <Link href="/dashboard/assistant">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-900/60"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled 
                              className="h-8 w-8 text-zinc-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteDocument(doc.id)}
                            className="h-8 w-8 text-zinc-450 hover:text-rose-400 hover:bg-zinc-900/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
