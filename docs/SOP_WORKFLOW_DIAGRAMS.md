# Central Bank of India — PAPG Workflow Diagrams & Visual Architecture Repository

This repository contains the complete set of visual process flows, swimlane diagrams, state transition models, and system architecture blueprints for the **Payment Aggregator Request Automation Portal (PAPG)**.

---

## 1. Master Multi-Role Swimlane Workflow Diagram

This swimlane diagram illustrates the end-to-end operational lifecycle and inter-departmental task handoffs across all organizational tiers of Central Bank of India and external Payment Aggregators.

```mermaid
sequenceDiagram
    autonumber
    actor BO as Branch Office (BO)
    actor RO as Regional Office (RO)
    actor ZO as Zonal Office (ZO)
    actor CO as Central Office (CO / Admin)
    actor PA as Payment Aggregators (AEPA)
    actor CUST as Merchant / Customer

    Note over BO,CUST: PHASE 1: APPLICATION INITIATION & PROJECTION SETUP
    BO->>BO: Collect Merchant KYC & Financials
    BO->>BO: Fill Application Form & Payment Projections (IB, UPI, Cards)
    BO->>BO: Upload KYC & Application Documents
    BO->>RO: Submit Application with Branch Consent

    Note over RO,ZO: PHASE 2: REGIONAL & ZONAL OFFICE VETTING
    RO->>RO: Review Account Balance, Projections & Turnover
    RO->>RO: Upload Regional Head (RH) Recommendation Note
    alt High Volume / Turnover Threshold Reached
        RO->>ZO: Forward to Zonal Office for Endorsement
        ZO->>ZO: Upload Zonal Head (ZH) Recommendation Note
        ZO->>CO: Endorse & Escalate to Central Office
    else Standard Volume Threshold
        RO->>CO: Recommend & Submit to Central Office
    end

    Note over CO,PA: PHASE 3: AGGREGATOR SELECTION & RFP DISPATCH
    CO->>CO: Review Projected Volume & Merchant Classification
    CO->>CO: Select Empanelled Payment Aggregators (BillDesk, CCAvenue, Razorpay, etc.)
    CO->>CO: Set RFP Submission Deadline & Configure Email Dispatch
    CO->>PA: Automated RFP Quotation Request Email Sent
    
    Note over PA,CO: PHASE 4: AGGREGATOR QUOTATION SUBMISSION
    PA->>PA: Review Transaction Channels & Volumes
    PA->>PA: Submit Channel-Wise Rates (SBI/HDFC/ICICI IB, Rupay/Visa/Master Debit, CC, UPI)
    PA->>CO: Quotation Submitted into Portal

    Note over CO,CUST: PHASE 5: COMMERCIAL EVALUATION, MARKUP & CBA MATRIX
    CO->>CO: Open Cost-Benefit Analysis (CBA) Evaluation Matrix
    CO->>CO: Apply Bank Markup (%) across Channels
    CO->>CO: System Computes Gross Revenue, Vendor Share & Net Bank Margin
    CO->>CO: Finalize Most Viable Aggregator (Green Header Selection)
    CO->>RO: Forward Finalized Commercial Quote

    Note over RO,CUST: PHASE 6: MERCHANT ACCEPTANCE & RATE NEGOTIATION
    RO->>CUST: Present Official Quotation Preview
    alt Merchant Accepts Terms
        CUST->>RO: Sign & Seal Acceptance Document
        RO->>RO: Upload Signed Customer Acceptance Document
        RO->>CO: Confirm Merchant Acceptance
    else Merchant Requests Rate Revision
        CUST->>RO: Request Commercial Re-negotiation
        RO->>CO: Return for Rate Revision / Alternative Quote
    end

    Note over CO,BO: PHASE 7: SANCTION LETTER & PURCHASE ORDER (PO) ISSUANCE
    CO->>CO: Enter Purchase Order Details (Authorized Signatory, RCC Contact)
    CO->>CO: System Auto-Generates Central Bank Sanction Letter (.docx)
    CO->>CO: Generate & Issue Official Purchase Order (PO)
    CO->>BO: Sanction Letter & PO Published
    BO->>CUST: Deliver Sanction Letter & Initiate Gateway Technical Integration
```

---

## 2. Application State Machine Lifecycle Diagram

The portal manages application progression through 10 distinct status states with strict validation gates:

```mermaid
stateDiagram-v2
    [*] --> applicationSubmitted : BO Submits Application + KYC

    applicationSubmitted --> approvedbyro : RO Reviews & Uploads RH Note
    applicationSubmitted --> rejectedbyro : RO Rejects with Remarks

    approvedbyro --> approvedbyzo : ZO Reviews (High Value Cases)
    approvedbyro --> approvedbyco : Direct CO Forward (Standard Cases)
    approvedbyro --> rejectedbyzo : ZO Rejects with Remarks

    approvedbyzo --> approvedbyco : ZO Endorses & Forwards
    
    approvedbyco --> quoterequested : CO Selects PAs & Dispatches RFP
    approvedbyco --> rejectedbyco : CO Rejects with Remarks

    quoterequested --> quotesubmitted : PAs Submit Channel Commercial Rates
    
    quotesubmitted --> reviewquote : CO Enters Markup & Runs CBA Comparison
    
    reviewquote --> quoteaccepted : Merchant Accepts Quote (RO Uploads Doc)
    reviewquote --> quotesubmitted : Merchant Negotiates (Rate Revision)

    quoteaccepted --> finalapproval : CO Adds PO Details & Issues Sanction Letter
    
    finalapproval --> [*] : PO Issued & Workflow Completed
    rejectedbyro --> [*] : Closed (Rejected)
    rejectedbyzo --> [*] : Closed (Rejected)
    rejectedbyco --> [*] : Closed (Rejected)
```

---

## 3. Cost-Benefit Analysis (CBA) Matrix Decision Flowchart

```mermaid
graph TD
    A[CO Opens Aggregator Quotes] --> B[Evaluate Channel Rates Side-by-Side]
    B --> C[Enter Proposed Bank Markup %]
    C --> D[System Computes Total Gross Revenue]
    D --> E[System Computes Total Vendor Share]
    E --> F[System Computes Net Expected Revenue to Bank]
    
    F --> G{Select Optimal Aggregator}
    G -->|Vendor A Selected| H[Header Highlighted GREEN - Finalized]
    G -->|Vendor B, C Rejected| I[Header Highlighted RED - Rejected]
    
    H --> J[Lock Finalized Commercial Matrix]
    J --> K[Generate Customer Quotation Proposal]
```

---

## 4. Sanction Letter & Document Generation Flow

```mermaid
flowchart LR
    subgraph Data Layer
        A1[Customer Details & Account No]
        A2[Finalized Aggregator Name & ID]
        A3[Commercial Rates & Markup Matrix]
        A4[Authorized Signatory & RCC Person]
    end

    subgraph Generation Engine
        B1[Central Bank Official Template Header]
        B2[Dynamic Word .docx Builder]
        B3[Purchase Order PDF Generator]
    end

    subgraph Output Artifacts
        C1[Official Sanction Letter .docx]
        C2[Central Bank Purchase Order PO-XXXX]
        C3[Audit Trail Timestamp Record]
    end

    Data Layer --> Generation Engine
    Generation Engine --> Output Artifacts
```

---

## 5. System Route & Module Architecture

```mermaid
graph TB
    subgraph Core Portal Navigation
        R1[Login /login] --> R2[Dashboard /dashboard]
        R2 --> R3[All Applications /applications]
        R2 --> R4[Manage Aggregators /manage-aggregrator - CO Only]
        R2 --> R5[Aggregator Dashboard /aggregrator-dashboard]
        R2 --> R6[Help Desk /helpdesk]
        R2 --> R7[Standard Annexures /annexures]
        R2 --> R8[Test Flow Simulation /test-flow]
    end

    subgraph Modals & Overlays
        R2 --> M1[Admin Role Switcher Modal]
        R2 --> M2[Application Stepper Modal - 5 Steps]
        R2 --> M3[Audit Trail History Modal]
        R2 --> M4[Cost-Benefit Analysis CBA Modal]
        R2 --> M5[Rejection Reason Modal]
    end

    subgraph Error Handling
        E1[404 Not Found]
        E2[403 Access Denied]
        E3[500 Server Error]
        E4[Service Down / Maintenance]
    end
```
