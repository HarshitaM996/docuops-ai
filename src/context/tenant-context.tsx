"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Highlight {
  id: string;
  text: string;
  type: "risk" | "neutral" | "compliant";
  title: string;
  description: string;
  section: string;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  status: "Processing" | "Indexed" | "Failed";
  uploadedAt: string;
  failReason?: string;
  content?: {
    title: string;
    sections: { heading: string; text: string }[];
    highlights: Highlight[];
  };
}

export interface Alert {
  id: string;
  severity: "high" | "medium" | "low";
  documentName: string;
  message: string;
  timestamp: string;
}

export interface Tenant {
  id: string;
  name: string;
  complianceScore: number;
  processedCount: number;
  alerts: Alert[];
  documents: Document[];
}

interface TenantContextProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  setActiveTenant: (id: string) => void;
  addDocument: (name: string, size: number) => void;
  deleteDocument: (id: string) => void;
  getHighlightDetails: (docId: string, highlightId: string) => Highlight | undefined;
}

const initialTenants: Tenant[] = [
  {
    id: "apex-legal",
    name: "Apex Legal & Co",
    complianceScore: 94,
    processedCount: 128,
    alerts: [
      {
        id: "alert-1",
        severity: "high",
        documentName: "Employment_Agreement_Draft.pdf",
        message: "Missing governing law and jurisdiction clauses.",
        timestamp: "2 hours ago",
      },
      {
        id: "alert-2",
        severity: "low",
        documentName: "GDPR_DPA_Apex.docx",
        message: "Sub-processor list has not been updated in 6 months.",
        timestamp: "1 day ago",
      },
    ],
    documents: [
      {
        id: "doc-apex-1",
        name: "Mutual_NDA_v2.pdf",
        size: "1.2 MB",
        status: "Indexed",
        uploadedAt: "2026-06-10T14:32:00Z",
        content: {
          title: "MUTUAL NON-DISCLOSURE AGREEMENT",
          sections: [
            {
              heading: "1. Purpose",
              text: "The parties wish to explore a business opportunity of mutual interest (the 'Relationship') and in connection with this Relationship, each party may disclose to the other certain proprietary and confidential information."
            },
            {
              heading: "2. Definition of Confidential Information",
              text: "Confidential Information means any proprietary information, technical data, trade secrets or know-how disclosed by either party, either directly or indirectly, in writing, orally or by drawings. However, Confidential Information does not include information that is or becomes publicly known through no breach by the receiving party."
            },
            {
              heading: "3. Term of Protection",
              text: "The protection for Confidential Information under this Agreement shall expire exactly one (1) year after the date of disclosure, after which the receiving party shall have no obligation of confidentiality."
            },
            {
              heading: "4. Return of Materials",
              text: "Upon request, the receiving party shall return or destroy all physical and digital copies of the disclosing party's Confidential Information within thirty (30) business days."
            },
            {
              heading: "5. Governing Law",
              text: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without reference to conflict of laws principles. Any litigation shall be conducted in state or federal courts located in Wilmington, Delaware."
            }
          ],
          highlights: [
            {
              id: "hl-apex-1",
              text: "expire exactly one (1) year after the date of disclosure",
              type: "risk",
              title: "Short Confidentiality Term",
              description: "A 1-year confidentiality term is extremely short for enterprise agreements. Standard practice requires at least 3 to 5 years, or indefinite protection for trade secrets.",
              section: "3. Term of Protection"
            },
            {
              id: "hl-apex-2",
              text: "within thirty (30) business days",
              type: "neutral",
              title: "Slow Return Period",
              description: "A 30-day window to return or destroy confidential material is longer than the typical 10 to 15 days, potentially leaving data exposed for longer.",
              section: "4. Return of Materials"
            },
            {
              id: "hl-apex-3",
              text: "State of Delaware",
              type: "compliant",
              title: "Standard Choice of Law",
              description: "Delaware law is widely accepted, predictable, and highly standard for corporate agreements.",
              section: "5. Governing Law"
            }
          ]
        }
      },
      {
        id: "doc-apex-2",
        name: "GDPR_DPA_Apex.docx",
        size: "2.4 MB",
        status: "Indexed",
        uploadedAt: "2026-06-12T09:15:00Z",
        content: {
          title: "DATA PROCESSING ADDENDUM (GDPR)",
          sections: [
            {
              heading: "1. Scope & Application",
              text: "This Data Processing Addendum ('DPA') applies to the processing of personal data by Processor on behalf of Controller in the course of providing services under the Master Agreement."
            },
            {
              heading: "2. Technical and Organizational Security Measures",
              text: "Processor shall implement and maintain appropriate technical and organizational measures as specified in Annex II to protect Controller Personal Data against unauthorized or unlawful processing and accidental loss."
            },
            {
              heading: "3. Breach Notification",
              text: "In the event of a security incident, Processor shall notify Controller without undue delay, and in any case no later than seventy-two (72) hours after becoming aware of the breach."
            },
            {
              heading: "4. Liability and Indemnity",
              text: "Neither party limits its liability for breaches of this DPA. However, under no circumstances will either party be liable to the other for indirect, special, or consequential damages."
            }
          ],
          highlights: [
            {
              id: "hl-apex-4",
              text: "no later than seventy-two (72) hours",
              type: "compliant",
              title: "Standard GDPR Breach Notification",
              description: "The 72-hour notification threshold aligns perfectly with standard GDPR Article 33 requirements.",
              section: "3. Breach Notification"
            },
            {
              id: "hl-apex-5",
              text: "Neither party limits its liability for breaches of this DPA",
              type: "neutral",
              title: "Unlimited Liability for DPA",
              description: "Having unlimited liability for data protection breaches is highly favorable to the Controller but increases overall operational risk for the Processor.",
              section: "4. Liability and Indemnity"
            }
          ]
        }
      },
      {
        id: "doc-apex-3",
        name: "Employment_Agreement_Draft.pdf",
        size: "840 KB",
        status: "Failed",
        failReason: "Critical policy violations detected: Missing governing law clause; non-compete scope is overly broad and unenforceable in standard jurisdictions.",
        uploadedAt: "2026-06-14T17:45:00Z",
      }
    ]
  },
  {
    id: "vanguard-biotech",
    name: "Vanguard BioTech",
    complianceScore: 78,
    processedCount: 45,
    alerts: [
      {
        id: "alert-3",
        severity: "high",
        documentName: "Clinical_Trial_Consent_Form.pdf",
        message: "Missing explicit medical disclaimer and HIPAA waiver references.",
        timestamp: "5 mins ago",
      },
      {
        id: "alert-4",
        severity: "medium",
        documentName: "IP_Assignment_v1.pdf",
        message: "Key IP developer signature missing on page 14.",
        timestamp: "4 days ago",
      },
    ],
    documents: [
      {
        id: "doc-vanguard-1",
        name: "Clinical_Trial_Consent_Form.pdf",
        size: "3.1 MB",
        status: "Processing",
        uploadedAt: "2026-06-15T11:45:00Z"
      },
      {
        id: "doc-vanguard-2",
        name: "FDA_Compliance_Report.docx",
        size: "4.8 MB",
        status: "Indexed",
        uploadedAt: "2026-06-08T10:00:00Z",
        content: {
          title: "VANGUARD CLINICAL TRIAL COMPLIANCE REPORT",
          sections: [
            {
              heading: "1. Executive Summary",
              text: "This report evaluates the compliance of Phase II clinical trials conducted by Vanguard BioTech for therapeutic compound VG-909. Inspections were conducted under FDA 21 CFR Part 11 requirements."
            },
            {
              heading: "2. Record Storage and Security",
              text: "All investigator files and electronic case report forms (eCRFs) are stored on internal local hard drives with shared folder access. Password protection is applied on a per-document basis."
            },
            {
              heading: "3. Patient Consent Protocols",
              text: "Informed consent was obtained from 100% of participants prior to administration of VG-909. Written documentation is archived in the main laboratory locker."
            }
          ],
          highlights: [
            {
              id: "hl-vanguard-1",
              text: "stored on internal local hard drives with shared folder access",
              type: "risk",
              title: "Insecure EHR Storage",
              description: "Storing clinical records on local drives with shared network folders violates FDA Part 11 and HIPAA. A validated cloud-based Electronic Data Capture (EDC) system with audit logs must be used.",
              section: "2. Record Storage and Security"
            },
            {
              id: "hl-vanguard-2",
              text: "Password protection is applied on a per-document basis",
              type: "risk",
              title: "Lack of Audit Trail",
              description: "Document-level password protection does not comply with 21 CFR Part 11 requirements for electronic signatures and cryptographically verified system-wide audit trails.",
              section: "2. Record Storage and Security"
            }
          ]
        }
      },
      {
        id: "doc-vanguard-3",
        name: "IP_Assignment_v1.pdf",
        size: "1.1 MB",
        status: "Failed",
        failReason: "Signature verification failed: Executed copy is missing the signature of Chief Scientific Officer (CSO) and notary stamp required for international patents.",
        uploadedAt: "2026-06-11T12:00:00Z"
      },
      {
        id: "doc-vanguard-4",
        name: "Material_Transfer_Agreement.pdf",
        size: "920 KB",
        status: "Indexed",
        uploadedAt: "2026-06-14T08:30:00Z",
        content: {
          title: "MATERIAL TRANSFER AGREEMENT",
          sections: [
            {
              heading: "1. Scope of Transfer",
              text: "Provider transfers to Recipient the biological materials described in Exhibit A (the 'Material') solely for non-commercial research purposes."
            },
            {
              heading: "2. Intellectual Property Rights",
              text: "All rights, title, and interest in the Material, including any modifications made by Recipient, shall remain the sole and exclusive property of Provider. Recipient shall not file any patent applications claiming the Material or modifications."
            }
          ],
          highlights: [
            {
              id: "hl-vanguard-3",
              text: "including any modifications made by Recipient, shall remain the sole and exclusive property of Provider",
              type: "risk",
              title: "Aggressive IP Clawback",
              description: "Restricting Recipient's rights over modifications is a highly restrictive IP provision. Standard academic MTAs usually grant ownership of modifications to the creator (Recipient), subject to a license back to Provider.",
              section: "2. Intellectual Property Rights"
            }
          ]
        }
      }
    ]
  },
  {
    id: "lexcorp-finance",
    name: "LexCorp Finance",
    complianceScore: 85,
    processedCount: 210,
    alerts: [
      {
        id: "alert-5",
        severity: "medium",
        documentName: "Vendor_Security_Addendum.pdf",
        message: "Vendor has not provided SOC 2 Type II report for current fiscal year.",
        timestamp: "5 hours ago",
      }
    ],
    documents: [
      {
        id: "doc-lex-1",
        name: "Q1_Financial_Audit_2026.pdf",
        size: "12.5 MB",
        status: "Indexed",
        uploadedAt: "2026-06-05T16:00:00Z",
        content: {
          title: "Q1 2026 FINANCIAL AUDIT COMPLIANCE REPORT",
          sections: [
            {
              heading: "1. Internal Controls Assessment",
              text: "We performed audits on LexCorp internal accounting systems. Our testing confirmed that segregation of duties is maintained for all accounts payable transactions exceeding $50,000. Transactions under $50,000 can be authorized by a single account manager."
            },
            {
              heading: "2. Reconciliation Procedures",
              text: "Bank reconciliations are performed monthly by the accounting team. Discrepancies are flagged and reviewed by the CFO within 45 days of the statement close."
            }
          ],
          highlights: [
            {
              id: "hl-lex-1",
              text: "Transactions under $50,000 can be authorized by a single account manager",
              type: "risk",
              title: "Weak Internal Controls Limit",
              description: "A threshold of $50,000 for single-authorization accounts payable represents a significant fraud risk. Standard corporate controls require dual authorization for any transaction above $10,000.",
              section: "1. Internal Controls Assessment"
            },
            {
              id: "hl-lex-2",
              text: "reviewed by the CFO within 45 days",
              type: "neutral",
              title: "Reconciliation Delay",
              description: "A 45-day review period for bank discrepancies is slightly longer than the financial standard of 30 days, which may delay the detection of unauthorized charges.",
              section: "2. Reconciliation Procedures"
            }
          ]
        }
      },
      {
        id: "doc-lex-2",
        name: "Anti_Money_Laundering_Policy.pdf",
        size: "1.8 MB",
        status: "Indexed",
        uploadedAt: "2026-06-07T11:00:00Z",
        content: {
          title: "ANTI-MONEY LAUNDERING (AML) POLICY",
          sections: [
            {
              heading: "1. Policy Statement",
              text: "LexCorp is committed to preventing the use of its financial services for money laundering and terrorist financing. We enforce robust Know Your Customer (KYC) guidelines for all active accounts."
            },
            {
              heading: "2. Customer Verification (KYC)",
              text: "For individual clients, verification requires one government-issued photo ID and a utility bill dated within the last 180 days. For corporate clients, a certificate of incorporation is required."
            }
          ],
          highlights: [
            {
              id: "hl-lex-3",
              text: "utility bill dated within the last 180 days",
              type: "risk",
              title: "Outdated Proof of Address Requirement",
              description: "FINRA and international AML standards mandate proof of address documents (like utility bills) to be dated within the last 90 days. 180 days leaves the system open to fraud and compliance audit failures.",
              section: "2. Customer Verification (KYC)"
            }
          ]
        }
      },
      {
        id: "doc-lex-3",
        name: "Vendor_Security_Addendum.pdf",
        size: "950 KB",
        status: "Processing",
        uploadedAt: "2026-06-15T12:00:00Z"
      }
    ]
  }
];

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [activeTenantId, setActiveTenantId] = useState<string>("apex-legal");

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const setActiveTenant = (id: string) => {
    if (tenants.some((t) => t.id === id)) {
      setActiveTenantId(id);
    }
  };

  // Simulate file processing for documents in "Processing" state
  useEffect(() => {
    const interval = setInterval(() => {
      setTenants((prevTenants) => {
        let updated = false;
        const nextTenants = prevTenants.map((t) => {
          const documents = t.documents.map((doc) => {
            if (doc.status === "Processing") {
              updated = true;
              // Randomly finish as Indexed (80%) or Failed (20%)
              const isSuccess = Math.random() > 0.2;
              if (isSuccess) {
                // Return indexed mock document
                return {
                  ...doc,
                  status: "Indexed" as const,
                  content: {
                    title: `UPLOADED DOCUMENT: ${doc.name.toUpperCase().replace(/\.[^/.]+$/, "")}`,
                    sections: [
                      {
                        heading: "1. Preamble & Scope",
                        text: "This document governs the operational and security protocols established between the signing parties for standard engagement. Compliance reviews are performed on a periodic basis."
                      },
                      {
                        heading: "2. Liability & Disclaimers",
                        text: "Except for breaches of confidentiality or IP ownership, neither party's aggregate liability under this agreement shall exceed a maximum cap of two hundred thousand dollars ($200,000)."
                      }
                    ],
                    highlights: [
                      {
                        id: `hl-new-${doc.id}-1`,
                        text: "exceed a maximum cap of two hundred thousand dollars ($200,000)",
                        type: "neutral" as const,
                        title: "Liability Cap Configured",
                        description: "The liability cap is set to $200,000, which is standard for mid-level vendor agreements but may require raising for high-value operations.",
                        section: "2. Liability & Disclaimers"
                      }
                    ]
                  }
                };
              } else {
                return {
                  ...doc,
                  status: "Failed" as const,
                  failReason: "Document text extraction failed: Scanned copy is illegible or corrupted. Please upload a clear digital PDF."
                };
              }
            }
            return doc;
          });

          if (updated) {
            // Update stats & alerts if we had items finish processing
            const processedCount = documents.filter((d) => d.status === "Indexed").length + t.processedCount;
            // Count failed ones that were just processed
            const failedCount = documents.filter((d) => d.status === "Failed").length;
            const newAlerts = [...t.alerts];
            documents.forEach((d, index) => {
              const prevDoc = t.documents[index];
              if (prevDoc.status === "Processing" && d.status === "Failed") {
                newAlerts.unshift({
                  id: `alert-new-${d.id}`,
                  severity: "medium",
                  documentName: d.name,
                  message: d.failReason || "Failed processing",
                  timestamp: "Just now"
                });
              }
            });

            // Adjust score slightly on new index/failed checks
            const indexedCount = documents.filter((d) => d.status === "Indexed").length;
            const failedDetections = documents.filter((d) => d.status === "Failed").length;
            const totalDocs = indexedCount + failedDetections || 1;
            const newScore = Math.min(100, Math.max(50, Math.round(100 - (failedDetections / totalDocs) * 20)));

            return {
              ...t,
              documents,
              processedCount,
              alerts: newAlerts,
              complianceScore: newScore
            };
          }
          return t;
        });

        return updated ? nextTenants : prevTenants;
      });
    }, 15000); // Check and simulate progress every 15s

    return () => clearInterval(interval);
  }, []);

  const addDocument = (name: string, sizeBytes: number) => {
    // format size
    const size = sizeBytes > 1024 * 1024 
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
      : `${(sizeBytes / 1024).toFixed(0)} KB`;

    const newDoc: Document = {
      id: `doc-uploaded-${Date.now()}`,
      name,
      size,
      status: "Processing",
      uploadedAt: new Date().toISOString()
    };

    setTenants((prevTenants) =>
      prevTenants.map((t) => {
        if (t.id === activeTenantId) {
          return {
            ...t,
            documents: [newDoc, ...t.documents]
          };
        }
        return t;
      })
    );
  };

  const deleteDocument = (id: string) => {
    setTenants((prevTenants) =>
      prevTenants.map((t) => {
        if (t.id === activeTenantId) {
          return {
            ...t,
            documents: t.documents.filter((d) => d.id !== id)
          };
        }
        return t;
      })
    );
  };

  const getHighlightDetails = (docId: string, highlightId: string): Highlight | undefined => {
    const doc = activeTenant.documents.find((d) => d.id === docId);
    return doc?.content?.highlights.find((h) => h.id === highlightId);
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        setActiveTenant,
        addDocument,
        deleteDocument,
        getHighlightDetails,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenants = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenants must be used within a TenantProvider");
  }
  return context;
};
