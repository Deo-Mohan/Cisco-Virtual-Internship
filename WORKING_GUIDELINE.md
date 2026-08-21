# 📘 Working Guideline — Cisco Zero-Trust Hybrid Data Center Simulation

> A step-by-step guide for using this web-based simulation portal alongside **Cisco Packet Tracer** to validate a Zero-Trust network architecture.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Getting Started — Web Portal](#2-getting-started--web-portal)
3. [Understanding the Dashboard](#3-understanding-the-dashboard)
4. [Running the Threat Simulator](#4-running-the-threat-simulator)
5. [Using with Cisco Packet Tracer](#5-using-with-cisco-packet-tracer)
6. [IaC Explorer & Security Policies](#6-iac-explorer--security-policies)
7. [Interpreting Visual Indicators](#7-interpreting-visual-indicators)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### For the Web Simulation Portal
| Requirement | Version |
|-------------|---------|
| Node.js | v18 or later |
| npm | v9 or later |
| Browser | Chrome / Edge / Firefox (latest) |

### For Cisco Packet Tracer Validation
| Requirement | Version |
|-------------|---------|
| Cisco Packet Tracer | v8.2 or later |
| `.pkt` file | Downloaded from the portal (see Step 5) |

---

## 2. Getting Started — Web Portal

### Step 1: Clone the Repository
```bash
git clone https://github.com/Deo-Mohan/Cisco-Virtual-Internship.git
cd Cisco-Virtual-Internship
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Launch the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser. You should see the full interactive dashboard with the network topology.

---

## 3. Understanding the Dashboard

The interface is divided into the following sections:

### 🔷 Header Bar
- **Logo & Title** — Cisco Hybrid Data Center Simulator
- **Status Badge** — Shows the current network state:
  - 🟢 `SECURE (Normal Traffic)` — All systems healthy
  - 🔴 `ATTACK IN PROGRESS` — Threat simulation is running
  - 🔵 `THREAT CONTAINED` — Attack has been isolated

### 🔷 Real-Time Stats HUD
Four metric cards showing live data:
| Metric | Idle Value | During Attack |
|--------|-----------|---------------|
| System Integrity | 100% | 14% |
| Containment Actions | 0 Filters | 3 Filters Active |
| Transit Latency | 12 ms | 45 ms |
| Tunnel Status | IPsec UP | IPsec UP |

### 🔷 Network Topology Canvas (Left Panel)
An interactive SVG-based network map inspired by **Cisco Packet Tracer**:
- **Nodes** — Click any node (Internet, Hub, Student Spoke, etc.) to view its details in the Node Inspector below.
- **Envelope Packets** — Small green envelope icons animate along each link to simulate data flow.
- **Interface Labels** — `fa0/0`, `fa0/1`, `g0/0` labels appear near node endpoints, mimicking Packet Tracer port naming.
- **Link Lights** — Small green dots at link endpoints indicate active/healthy connections.

### 🔷 Monitor Logs (Right Panel)
A terminal-style console that displays real-time security event logs. During threat simulation, it shows the attack sequence, firewall blocks, and containment results.

### 🔷 Node Inspector & Live Firewall Telemetry (Below Topology)
- **Node Inspector** — When you click a node, it shows the IP, role, description, and security details as colorful pills.
- **Live Firewall Telemetry** — A real-time SVG line chart showing packet inspection throughput, blocked threat counts, and CPU load.

### 🔷 Controls Bar
| Button | Action |
|--------|--------|
| 🚀 **Run Threat Simulator** | Starts the 6-step attack simulation |
| 🔄 **Reset Network** | Restores all nodes to healthy idle state |
| 📥 **Download .PKT Guide** | Downloads a Packet Tracer reference file |

---

## 4. Running the Threat Simulator

The simulation models a real-world lateral movement attack scenario based on **PRD Section 14**:

### Attack Sequence

| Step | Time | Event |
|------|------|-------|
| 1 | 0s | Compromised SSH key in Research-App container |
| 2 | 1s | Attacker scans local hosts from `10.3.1.15` |
| 3 | 2s | Lateral movement attempt to Student Spoke (`10.1.0.0/16`) |
| 4 | 3s | **BLOCKED** — Cisco Firewall drops cross-spoke traffic |
| 5 | 4s | Attacker tries Kubernetes API & Research Database access |
| 6 | 5s | **CONTAINED** — K8s NetworkPolicy confines blast radius |

### What You'll See

1. **Red threat envelopes** (with `!`) travel from Internet → Hub → Research Spoke
2. **Orange bounce-back envelopes** (with `X`) show blocked lateral attempts
3. **Red firewall block indicators** appear mid-path between Hub and Student/Faculty spokes
4. **Research Spoke node** turns red with a pulsing border
5. After containment, **green shield rings** pulse around the Research Spoke
6. The terminal log shows the full audit trail with color-coded entries

### How to Run
1. Click **🚀 Run Threat Simulator** button
2. Watch the 6-second simulation unfold
3. Observe the terminal logs on the right panel (they auto-scroll within the panel)
4. After completion, the status badge changes to **THREAT CONTAINED**
5. Click **🔄 Reset Network** to restore all systems

---

## 5. Using with Cisco Packet Tracer

This section explains how to correlate the web simulation with a hands-on Cisco Packet Tracer lab.

### Step 1: Download the PKT Reference
- Click the **📥 Download .PKT Guide** button on the web portal
- This downloads a `.pkt` reference template

### Step 2: Open in Cisco Packet Tracer
- Launch **Cisco Packet Tracer v8.2+**
- Open the downloaded `.pkt` file
- You'll see the same Hub-and-Spoke topology with:
  - 1x ASA 5506-X (Firewall / VPN Gateway)
  - 1x Layer 3 Switch (Transit Hub)
  - 3x Spoke VLANs (Student, Faculty, Research)
  - 1x Server (On-Prem Data Center)

### Step 3: Apply ASA Configuration
1. In the web portal, click the **"Cisco Technology Mappings"** tab on the right panel
2. Or navigate to the **IaC Explorer** section at the bottom and select `cisco/cisco-asa.cfg`
3. Copy the CLI commands from the portal's code viewer
4. In Packet Tracer, click the ASA device → CLI tab → paste the commands:

```
! Key commands to apply:
interface GigabitEthernet1/1
 nameif outside
 security-level 0
 ip address 198.51.100.1 255.255.255.252
!
interface GigabitEthernet1/2
 nameif inside
 security-level 100
 ip address 10.10.1.1 255.255.255.0
!
! Block Research → Student lateral movement
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.1.0.0 255.255.0.0
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.2.0.0 255.255.0.0
access-list SEGMENTATION-ASA extended permit tcp 10.3.0.0 255.255.0.0 host 10.3.2.10 eq 5432
access-list SEGMENTATION-ASA extended permit ip any any
access-group SEGMENTATION-ASA in interface outside
```

### Step 4: Test Validation Commands in Packet Tracer

Open the CLI on each device and run these verification tests:

| Test | From Device | Command | Expected Result |
|------|------------|---------|----------------|
| ✅ Local DB Access | Student App Host | `ping 10.1.2.10` | **Success** — Allowed by local SG |
| ✅ VPN Tunnel | On-Prem Server | `ping 10.10.1.1` | **Success** — IPsec tunnel up |
| ❌ Cross-Spoke Block | Research Host (10.3.1.15) | `ping 10.1.1.5` | **Fail** — Blocked by ASA ACL |
| ❌ Cross-Spoke Block | Research Host (10.3.1.15) | `ping 10.2.1.5` | **Fail** — Blocked by ASA ACL |
| ✅ Research DB | Research App | `ping 10.3.2.10` | **Success** — Permitted explicitly |

### Step 5: Compare Results
- Cross-reference the Packet Tracer ping results with the web portal's threat simulation
- The web simulation visually demonstrates the same blocks that the ASA ACLs enforce in Packet Tracer
- Use the **Monitor Logs** tab to see the exact same firewall events

---

## 6. IaC Explorer & Security Policies

### Infrastructure as Code (IaC) Tab
Located at the bottom of the page. Contains 4 configuration files:

| File | Purpose |
|------|---------|
| `terraform/network.tf` | Hub-and-Spoke VPC network definitions & transit gateway routes |
| `k8s/network-policy.yaml` | Kubernetes `default-deny-all` ingress/egress policies |
| `iam/workload-identity.json` | IAM least-privilege bindings for workload containers |
| `cisco/cisco-asa.cfg` | Cisco ASA access-lists for spoke segmentation |

### Policy Mode Toggle
- **Strict Mode** (default) — Shows Zero-Trust enforced policies with transit gateway inspection
- **Permissive Mode** — Shows legacy configurations without micro-segmentation (for comparison)

### Security Group Rules Tab
A table showing the 4 key firewall rules:
- `SG-01`: Student App → Student DB (ALLOW TCP/5432)
- `SG-02`: Research App → Student Spoke (DENY ALL)
- `SG-03`: Faculty App → Exam DB (ALLOW TCP/3306)
- `SG-04`: Research Spoke → Private DC (DENY ALL)

---

## 7. Interpreting Visual Indicators

### Envelope Colors
| Color | Meaning |
|-------|---------|
| 🟢 Green | Normal healthy traffic |
| 🔵 Cyan | VPN/On-Prem tunnel traffic |
| 🔴 Red (with `!`) | Threat/attack packets |
| 🟠 Orange (with `X`) | Blocked/rejected packets bouncing back |

### Link Types
| Style | Meaning |
|-------|---------|
| **Solid line** | Physical fiber connection (Internet→Hub, VPN→On-Prem) |
| **Dashed flowing line** | Virtual peering / VPN tunnel overlay |

### Node Status LEDs
| Color | Meaning |
|-------|---------|
| 🟢 Green (steady) | Healthy / Active |
| 🟢 Green (pulsing) | Healthy with live traffic |
| 🔴 Red (pulsing) | Under threat / Compromised |
| 🟡 Amber (pulsing) | Contained / Recovering |

### Interface Labels
Labels like `fa0/0`, `fa0/1`, `g0/0` follow Cisco naming conventions:
- `fa` = FastEthernet port
- `g` = GigabitEthernet port
- The number after `/` indicates the port index

---

## 8. Troubleshooting

### Web Portal Issues

| Problem | Solution |
|---------|----------|
| Page won't load | Ensure `npm run dev` is running and visit `http://localhost:3000` |
| Animations not visible | Use a Chromium-based browser (Chrome/Edge) for best SVG support |
| Logs scroll the whole page | This has been fixed — logs now scroll only within the terminal panel |
| Next.js "N" logo showing | CSS hides it automatically; hard-refresh with `Ctrl+Shift+R` |

### Cisco Packet Tracer Issues

| Problem | Solution |
|---------|----------|
| `.pkt` file won't open | Ensure you have Packet Tracer v8.2+ installed |
| ASA commands rejected | Enter `enable` mode first, then `configure terminal` before pasting |
| Pings succeed when they shouldn't | Verify the access-list is applied: `show access-group` |
| VPN tunnel down | Check crypto map settings: `show crypto isakmp sa` |

### Build & Deploy

```bash
# Production build
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 📎 Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  CISCO ZERO-TRUST SIMULATION — QUICK REFERENCE      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟢 Green Envelope  = Normal traffic                │
│  🔴 Red Envelope    = Attack traffic                │
│  🟠 Orange Envelope = Blocked/Rejected              │
│                                                     │
│  Solid Line  = Physical connection                  │
│  Dashed Line = Virtual peering / VPN                │
│                                                     │
│  Click nodes → View details in inspector            │
│  Run Threat Sim → Watch 6-step attack scenario      │
│  Reset Network → Restore to healthy state           │
│                                                     │
│  IaC Explorer → View Terraform/K8s/ASA configs      │
│  Download .PKT → Get Packet Tracer template         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

> **Maintained by:** Cisco Virtual Internship Team — Cyber Track 2026  
> **Last Updated:** August 2026  
> **Version:** 2.0
