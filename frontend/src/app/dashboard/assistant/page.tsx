"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTenants, Document, Highlight } from "@/context/tenant-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, User, Send, FileText, AlertTriangle, ShieldCheck, Sparkles, HelpCircle, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "system";
  text: string;
  timestamp: Date;
}

export default function AICoformanceAssistant() {
  const { activeTenant } = useTenants();

  // Get only indexed documents
  const indexedDocs = activeTenant.documents.filter((d) => d.status === "Indexed");

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // Selected highlight to view in detail
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Set default document on mount or tenant switch
  useEffect(() => {
    if (indexedDocs.length > 0) {
      const firstDoc = indexedDocs[0];
      setSelectedDocId(firstDoc.id);
      setSelectedDoc(firstDoc);
      setActiveHighlight(null);
      // Reset chat
      setMessages([
        {
          id: "msg-welcome",
          sender: "system",
          text: `Hello! I have fully indexed **${firstDoc.name}** for ${activeTenant.name}. What compliance or legal checks would you like me to run? You can select specific highlighted clauses on the left to review risks in detail.`,
          timestamp: new Date()
        }
      ]);
    } else {
      setSelectedDocId("");
      setSelectedDoc(null);
      setActiveHighlight(null);
      setMessages([
        {
          id: "msg-welcome-empty",
          sender: "system",
          text: "No indexed documents found in this workspace. Please navigate to the Document Workspace to upload and index files.",
          timestamp: new Date()
        }
      ]);
    }
  }, [activeTenant.id]);

  // Handle Document Switch
  const handleDocChange = (id: string | null) => {
    if (!id) return;
    const doc = indexedDocs.find((d) => d.id === id) || null;
    setSelectedDocId(id);
    setSelectedDoc(doc);
    setActiveHighlight(null);
    if (doc) {
      setMessages([
        {
          id: `msg-welcome-${id}`,
          sender: "system",
          text: `Switched context to **${doc.name}**. I am ready to review policy matches. Try asking: *'Are there any liability caps?'* or *'Highlight GDPR risks.'*`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Handle Quick Prompts
  const handleQuickPrompt = (promptText: string) => {
    sendUserMessage(promptText);
  };

  // Submit User Message
  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendUserMessage(chatInput);
    setChatInput("");
  };

  const sendUserMessage = (text: string) => {
    if (!selectedDoc) return;
    
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Generate Contextual AI Response
    setTimeout(() => {
      setIsTyping(false);
      let aiText = "I have analyzed your query against the document. However, I need more context to identify specific matches. Please try asking about 'governing law', 'confidentiality term', or 'liability'.";
      
      const query = text.toLowerCase();

      if (selectedDoc.name === "Mutual_NDA_v2.pdf") {
        if (query.includes("term") || query.includes("confidentiality") || query.includes("duration")) {
          aiText = "Based on Section 3 ('Term of Protection'), the confidentiality obligations expire **exactly one (1) year** after disclosure. This is flagged as a **HIGH RISK** because enterprise NDAs typically require 3-5 years of protection. I recommend amending this to at least three (3) years.";
        } else if (query.includes("law") || query.includes("governing") || query.includes("jurisdiction")) {
          aiText = "According to Section 5, the governing law is set to the **State of Delaware** with jurisdiction in Wilmington. This is highly standard and represents **NO COMPLIANCE RISK**.";
        } else if (query.includes("return") || query.includes("destroy")) {
          aiText = "Section 4 ('Return of Materials') gives the receiving party **thirty (30) business days** to return or destroy confidential material. This is slightly slow (standard is 10-15 days), representing a **MEDIUM RISK** due to extended exposure.";
        } else {
          aiText = "I scanned **Mutual_NDA_v2.pdf**. Key items detected: a short 1-year confidentiality term (Section 3), standard Delaware governing law (Section 5), and a 30-day return window (Section 4). What section would you like to review?";
        }
      } else if (selectedDoc.name === "GDPR_DPA_Apex.docx") {
        if (query.includes("breach") || query.includes("notify") || query.includes("72")) {
          aiText = "Under Section 3 ('Breach Notification'), the processor must notify the controller within **seventy-two (72) hours**. This matches standard GDPR Article 33 requirements, representing a **COMPLIANT** threshold.";
        } else if (query.includes("liability") || query.includes("limit") || query.includes("cap")) {
          aiText = "Section 4 specifies that **neither party limits its liability for breaches of this DPA**, but limits consequential damages. Unlimited liability for data breaches is standard for Controllers but increases risk for the Processor. This is marked as a **NEUTRAL** policy posture.";
        } else {
          aiText = "I analyzed **GDPR_DPA_Apex.docx**. The notification threshold (72 hours) is GDPR compliant. The liability section has no caps for DPA breaches. Let me know if you want to test other clauses.";
        }
      } else if (selectedDoc.name === "FDA_Compliance_Report.docx") {
        if (query.includes("security") || query.includes("store") || query.includes("drive")) {
          aiText = "Section 2 states clinical logs are **stored on internal local hard drives with shared folder access**. This violates FDA 21 CFR Part 11 and HIPAA. This is a **HIGH COMPLIANCE RISK**. A validated system with audit trails must be implemented.";
        } else if (query.includes("password") || query.includes("audit") || query.includes("sign")) {
          aiText = "Section 2 mentions **document-level passwords** are used. This fails FDA Part 11 requirements because there are no cryptographically verified, system-wide audit trails tracking document changes. This is a **CRITICAL COMPLIANCE RISK**.";
        } else {
          aiText = "FDA Audit results: High risks found in Section 2 regarding local hard drive storage and lack of CFR Part 11 audit trails for electronic records. How would you like to address this?";
        }
      } else if (selectedDoc.name === "Material_Transfer_Agreement.pdf") {
        if (query.includes("ip") || query.includes("intellectual") || query.includes("modify")) {
          aiText = "Section 2 specifies that **all modifications made by the Recipient remain the sole and exclusive property of the Provider**. This represents an aggressive 'clawback' and is marked as a **HIGH RISK**. Usually, recipients retain ownership of modifications they create.";
        } else {
          aiText = "Material Transfer Agreement evaluation: An aggressive IP ownership clawback clause was detected in Section 2. Non-commercial research restrictions (Section 1) are standard.";
        }
      }

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: "system",
        text: aiText,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  // Helper to render inline highlighted text
  const renderHighlightedText = (fullText: string, targetText: string, type: string, highlightId: string) => {
    const parts = fullText.split(targetText);
    if (parts.length === 1) return <span>{fullText}</span>;

    const highlightColorClass = 
      type === "risk" 
        ? "bg-rose-500/15 text-rose-300 border-b border-rose-500/40 hover:bg-rose-500/25" 
        : type === "neutral"
        ? "bg-amber-500/15 text-amber-300 border-b border-amber-500/40 hover:bg-amber-500/25"
        : "bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/40 hover:bg-emerald-500/25";

    return (
      <span>
        {parts[0]}
        <span 
          onClick={() => {
            const hl = selectedDoc?.content?.highlights.find((h) => h.id === highlightId) || null;
            setActiveHighlight(hl);
          }}
          className={`cursor-pointer px-1 py-0.5 rounded font-medium transition-colors ${highlightColorClass} select-none`}
        >
          {targetText}
        </span>
        {parts[1]}
      </span>
    );
  };

  // Standard legal document templates if document is selected but has highlights
  const renderDocumentViewer = () => {
    if (!selectedDoc) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 space-y-3">
          <FileText className="h-10 w-10 text-zinc-700" />
          <p className="text-sm">No document selected. Choose a file from the dropdown above to audit.</p>
        </div>
      );
    }

    if (!selectedDoc.content) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 space-y-3">
          <AlertCircle className="h-10 w-10 text-zinc-700" />
          <p className="text-sm">No structured sections available. File status: {selectedDoc.status}.</p>
        </div>
      );
    }

    const { title, sections, highlights } = selectedDoc.content;

    return (
      <div className="space-y-6 select-text pr-2">
        <div className="border-b border-zinc-900 pb-4 text-center">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-1">
            Securely Ingested & Compliance Mapped
          </p>
        </div>

        {sections.map((section, index) => {
          // Check if any highlights match this section
          const matchingHighlights = highlights.filter((h) => h.section === section.heading);

          let paragraphNode: React.ReactNode = <span>{section.text}</span>;

          // If highlights exist, inject them dynamically into the paragraph
          if (matchingHighlights.length > 0) {
            matchingHighlights.forEach((hl) => {
              paragraphNode = renderHighlightedText(section.text, hl.text, hl.type, hl.id);
            });
          }

          return (
            <div key={index} className="space-y-1.5 text-left">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                {section.heading}
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400">
                {paragraphNode}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6 font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center">
            AI Compliance Assistant
            <Sparkles className="h-5 w-5 text-indigo-400 ml-2 animate-pulse" />
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Interact with your agreements in real-time, audit risky clauses, and generate compliance recommendations.
          </p>
        </div>

        {/* Top selector */}
        <div className="w-full sm:w-64">
          <Select value={selectedDocId} onValueChange={handleDocChange}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
              <SelectValue placeholder="Select active document" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
              {indexedDocs.length === 0 ? (
                <SelectItem value="none" disabled>No audited files</SelectItem>
              ) : (
                indexedDocs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Workspace Split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel: Document Viewer */}
        <div className="lg:col-span-7 flex flex-col space-y-4 min-h-0">
          <Card className="flex-1 flex flex-col border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden min-h-0">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-850 to-transparent" />
            
            <CardHeader className="py-3 px-4 border-b border-zinc-900 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Document Preview</span>
              </div>
              
              {selectedDoc && (
                <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[10px] px-2 py-0.5">
                  {selectedDoc.size}
                </Badge>
              )}
            </CardHeader>
            
            <ScrollArea className="flex-1 p-5 overflow-y-auto">
              {renderDocumentViewer()}
            </ScrollArea>
          </Card>

          {/* Inline Clause Audit Details */}
          {activeHighlight && (
            <Card className="border-zinc-800/80 bg-zinc-900/80 backdrop-blur-xl shrink-0 p-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
              <div className="flex items-start space-x-3.5">
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  activeHighlight.type === "risk" 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : activeHighlight.type === "neutral"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {activeHighlight.type === "risk" ? (
                    <AlertTriangle className="h-4.5 w-4.5" />
                  ) : activeHighlight.type === "neutral" ? (
                    <HelpCircle className="h-4.5 w-4.5" />
                  ) : (
                    <ShieldCheck className="h-4.5 w-4.5" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{activeHighlight.title}</h4>
                    <span className={`text-[10px] font-semibold capitalize ${
                      activeHighlight.type === "risk" 
                        ? "text-rose-400" 
                        : activeHighlight.type === "neutral"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}>
                      {activeHighlight.type} compliance rating
                    </span>
                  </div>
                  <blockquote className="text-[11px] italic text-zinc-300 bg-zinc-950/40 border-l border-zinc-800 pl-2.5 py-1 my-1">
                    "...{activeHighlight.text}..."
                  </blockquote>
                  <p className="text-[11px] text-zinc-400 leading-normal pt-1">
                    {activeHighlight.description}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel: Interactive Chat Assistant */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-zinc-900 bg-zinc-900/40 backdrop-blur-md relative overflow-hidden min-h-0">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-850 to-transparent" />
            
            <CardHeader className="py-3 px-4 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Compliance Chat Terminal</span>
              </div>
              <Badge className="bg-zinc-800 text-zinc-400 text-[9px] font-bold">GPT-4 Legal Model</Badge>
            </CardHeader>

            {/* Chat Body */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start space-x-2.5 max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      msg.sender === "user" 
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-300" 
                        : "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                    }`}>
                      {msg.sender === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-zinc-900/60 border border-zinc-900 text-zinc-300 rounded-tl-none"
                    }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-2.5 mr-auto max-w-[85%]">
                    <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-900 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce delay-75" />
                      <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggestions & Input */}
            <CardFooter className="flex flex-col p-3 border-t border-zinc-900 bg-zinc-950/20 shrink-0 space-y-3">
              {/* Suggestions */}
              {selectedDoc && (
                <div className="flex flex-wrap gap-2 w-full">
                  {[
                    "Identify liability caps?",
                    "Check compliance risk?",
                    "What governing law applies?"
                  ].map((p, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleQuickPrompt(p)}
                      disabled={isTyping}
                      className="text-[10px] font-semibold text-zinc-400 bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800/80 hover:text-white px-2.5 py-1 rounded-full transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Input */}
              <form onSubmit={handleSubmitChat} className="flex items-center space-x-2 w-full">
                <Input
                  placeholder={selectedDoc ? "Ask about clauses, risks, or compliance..." : "Upload files to ask questions..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={!selectedDoc || isTyping}
                  className="bg-zinc-950/80 border-zinc-850 text-xs focus-visible:ring-violet-500/20"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!selectedDoc || isTyping || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-9 w-9 rounded-xl border-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
