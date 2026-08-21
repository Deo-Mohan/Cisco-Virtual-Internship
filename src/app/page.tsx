"use client";

import React, { useState, useEffect, useRef } from 'react';

// node structure for the topology map
interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  type: 'onprem' | 'hub' | 'spoke' | 'internet' | 'vpn';
  role: string;
  status: 'active' | 'threat' | 'inactive';
  description: string;
  details: string[];
}

// syslog/network traffic log structure
interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'cisco';
}

const initialNodes: NetworkNode[] = [
  {
    id: 'internet',
    name: 'External Internet',
    ip: 'Any (0.0.0.0/0)',
    type: 'internet',
    role: 'Public Gateway',
    status: 'active',
    description: 'External ingress and public network access.',
    details: ['Only Port 443 (HTTPS) allowed to Public Load Balancers', 'All other traffic rejected by default']
  },
  {
    id: 'onprem',
    name: 'Private Data Center',
    ip: '10.10.0.0/16',
    type: 'onprem',
    role: 'Corporate Core',
    status: 'active',
    description: 'On-premises legacy systems and database master nodes.',
    details: ['Host-based firewall enabled', 'Connected via redundant IPsec VPN', 'Direct routes restricted to Hub VPC']
  },
  {
    id: 'vpn',
    name: 'Cisco ASA Security Gateway',
    ip: '10.10.1.1 / 198.51.100.1',
    type: 'vpn',
    role: 'VPN Gateway',
    status: 'active',
    description: 'Cisco ASA 5506-X endpoint establishing the IPsec hybrid link.',
    details: ['IKEv2 with AES-256 encryption', 'SHA-256 integrity hashing', 'Zero-Trust Access Control Lists (ACLs)']
  },
  {
    id: 'hub',
    name: 'Transit Hub VPC',
    ip: '10.0.0.0/16',
    type: 'hub',
    role: 'Inspection & Routing',
    status: 'active',
    description: 'Central transit VPC hosting routing services and security inspection.',
    details: ['AWS Transit Gateway hub', 'Simulated Cisco Secure Firewall Virtual appliance', 'Log Sink exporting VPC Flow Logs']
  },
  {
    id: 'spoke-student',
    name: 'Student Spoke VPC',
    ip: '10.1.0.0/16',
    type: 'spoke',
    role: 'Student Services',
    status: 'active',
    description: 'Hosting the Student Portal application and records.',
    details: ['Subnets: Public Ingress, Private App, Isolated Data', 'Role-Based Access Control (RBAC) active', 'Student-App and Student-DB workloads']
  },
  {
    id: 'spoke-faculty',
    name: 'Faculty Spoke VPC',
    ip: '10.2.0.0/16',
    type: 'spoke',
    role: 'Faculty & Exam Portals',
    status: 'active',
    description: 'Restricted VPC for academic management and exam hosting.',
    details: ['Faculty-App and Exam-App namespaces', 'Default-deny K8s NetworkPolicies', 'Explicit allow only for Exam-App to Exam-DB']
  },
  {
    id: 'spoke-research',
    name: 'Research Spoke VPC',
    ip: '10.3.0.0/16',
    type: 'spoke',
    role: 'Research Sandbox',
    status: 'active',
    description: 'VPC hosting isolated research and data-crunching resources.',
    details: ['Research-App and Research-DB workloads', 'Default-deny egress to other Spokes', 'Vulnerable app endpoint targeted in simulation']
  }
];

const mockCodeFiles = {
  terraform: `# Hub and Spoke VPC setup for the hybrid data center
# Using Terraform to provision network segments

resource "aws_vpc" "hub" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "cisco-cybertrack-hub-vpc"
    Role = "Transit-Inspection"
  }
}

resource "aws_vpc" "student" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "spoke-student-vpc"
    Tier = "Student-Services"
  }
}

resource "aws_vpc" "faculty" {
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "spoke-faculty-exam-vpc"
    Tier = "Academic-Administration"
  }
}

resource "aws_vpc" "research" {
  cidr_block           = "10.3.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "spoke-research-vpc"
    Tier = "Research-Sandbox"
  }
}

# peering spokes back to hub - no spoke-to-spoke direct routing allowed
resource "aws_vpc_peering_connection" "hub_to_student" {
  vpc_id        = aws_vpc.hub.id
  peer_vpc_id   = aws_vpc.student.id
  auto_accept   = true
  tags          = { Name = "peering-hub-student" }
}

resource "aws_vpc_peering_connection" "hub_to_faculty" {
  vpc_id        = aws_vpc.hub.id
  peer_vpc_id   = aws_vpc.faculty.id
  auto_accept   = true
  tags          = { Name = "peering-hub-faculty" }
}

resource "aws_vpc_peering_connection" "hub_to_research" {
  vpc_id        = aws_vpc.hub.id
  peer_vpc_id   = aws_vpc.research.id
  auto_accept   = true
  tags          = { Name = "peering-hub-research" }
}`,
  k8s: `# K8s network policy to isolate our pods
# Block everything by default and open only what is needed

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: research
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
# allow research app to query its database on port 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-research-db-ingress
  namespace: research
spec:
  podSelector:
    matchLabels:
      app: research-db
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: research-app
    ports:
    - protocol: TCP
      port: 5432
---
# restrict outbound traffic from research pods (block lateral movement)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-research-egress
  namespace: research
spec:
  podSelector:
    matchLabels:
      app: research-app
  policyTypes:
  - Egress
  egress:
  # only talk to database and local DNS
  - to:
    - podSelector:
        matchLabels:
          app: research-db
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53`,
  iam: `# IAM configuration for pods (Workload Identity)
# Least-privilege roles for the apps

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ResearchAppLeastPrivilege",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::cisco-research-data-bucket/*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/Workload": "research-app"
        }
      }
    },
    {
      "Sid": "DenyUnusedServices",
      "Effect": "Deny",
      "Action": [
        "iam:*",
        "rds:*",
        "ec2:*",
        "eks:*"
      ],
      "Resource": "*"
    }
  ]
}`,
  ciscoConfig: `! Cisco ASA Firewall configurations
! Enforce Access Control Lists (ACLs) to block transit traffic between spokes

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
! deny traffic from research (10.3.0.0) to student (10.1.0.0) and faculty/exam (10.2.0.0)
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.1.0.0 255.255.0.0
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.2.0.0 255.255.0.0
! allow db traffic for the research segment
access-list SEGMENTATION-ASA extended permit tcp 10.3.0.0 255.255.0.0 host 10.3.2.10 eq 5432
! bind access control list to the outside interface
access-group SEGMENTATION-ASA in interface outside
!
! VPN tunnel setup to on-premises gateway (10.10.0.0)
crypto ikev2 policy 10
 encryption aes-256
 integrity sha256
 group 19
 lifetime seconds 86400
!
crypto ipsec ikev2 ipsec-proposal PROPOSAL-AES256
 protocol esp encryption aes-256
 protocol esp integrity sha-256
!
crypto map MAP-HYBRID 10 match address IPSEC-ACL
crypto map MAP-HYBRID 10 set peer 203.0.113.2
crypto map MAP-HYBRID 10 set ikev2 ipsec-proposal PROPOSAL-AES256
crypto map MAP-HYBRID interface outside`
};

export default function Home() {
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(initialNodes[3]); // hub vpc selected first
  const [activeTab, setActiveTab] = useState<'logs' | 'packet-tracer' | 'cisco-mapping'>('logs');
  const [activeBottomTab, setActiveBottomTab] = useState<'iac' | 'sg-rules' | 'k8s-policies'>('iac');
  const [selectedFile, setSelectedFile] = useState<'terraform' | 'k8s' | 'iam' | 'ciscoConfig'>('terraform');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'contained'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: '13:46:02', source: 'SYS', message: 'Zero-Trust Hybrid Data Center security monitor online.', type: 'info' },
    { timestamp: '13:46:05', source: 'VPN', message: 'IPsec tunnel established with Private Data Center 10.10.0.0/16.', type: 'success' },
    { timestamp: '13:46:10', source: 'K8S', message: 'Kubernetes NetworkPolicies synchronized across 4 namespaces.', type: 'info' },
    { timestamp: '13:46:15', source: 'FW', message: 'Cisco Secure Firewall virtual appliance reports 0 active violations.', type: 'success' }
  ]);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // auto scroll logs to bottom whenever they update
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (source: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' | 'cisco') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { timestamp: time, source, message, type }]);
  };

  // kick off mock lateral movement attack simulation
  const runAttackSimulation = () => {
    if (simulationState === 'running') return;
    
    setSimulationState('running');
    setLogs([]); // flush log screen
    
    // flag the research spoke node as vulnerable
    setNodes((prev) =>
      prev.map((n) => (n.id === 'spoke-research' ? { ...n, status: 'threat' } : n))
    );

    let step = 0;
    const interval = setInterval(() => {
      switch (step) {
        case 0:
          addLog('SEC-TEAM', '⚠️ INTIALIZING SIMULATION: Compromising vulnerable Research-App container (Section 14)...', 'warning');
          break;
        case 1:
          addLog('ATTACKER', '😈 SSH Key-compromise achieved on Pod research-app-9c4456-x72j.', 'danger');
          addLog('ATTACKER', '😈 Local host scanning initiated from 10.3.1.15...', 'danger');
          break;
        case 2:
          addLog('ATTACKER', '⚡ Attempting lateral movement: Connect to Student Spoke VPC (10.1.0.0/16)...', 'danger');
          break;
        case 3:
          addLog('VPC-FIREWALL', '⛔ VPC Flow Logs Alert: Connection block from 10.3.1.15 to Student Ingress (10.1.1.5:80).', 'warning');
          addLog('CISCO-FW', '🛡️ Cisco Secure Firewall Virtual blocked cross-spoke traffic (No transitive routing).', 'success');
          break;
        case 4:
          addLog('ATTACKER', '⚡ Attempting lateral movement: Connect to Exam Portal database (10.2.2.10:5432)...', 'danger');
          break;
        case 5:
          addLog('K8S-POLICY', '⛔ Kubernetes audit log: NetworkPolicy "default-deny-all" blocked egress TCP egress to namespace "faculty-exam".', 'warning');
          addLog('CISCO-ISE', '🛡️ Cisco ISE Identity binding validates pod credentials and enforces containment segment.', 'success');
          break;
        case 6:
          addLog('ATTACKER', '⚡ Attempting to access Kubernetes Control Plane API Server...', 'danger');
          break;
        case 7:
          addLog('K8S-API', '⛔ Request Blocked. Namespace "research" restricted from accessing Kube-API endpoint.', 'warning');
          break;
        case 8:
          addLog('ATTACKER', '⚡ Attempting database connection: Access local Research Database (10.3.2.10:5432)...', 'info');
          break;
        case 9:
          addLog('K8S-POLICY', '✅ Connection ALLOWED: Policy "allow-research-db-ingress" permits local database access.', 'success');
          addLog('ATTACKER', '🔓 Read/Write access to local Research Database established.', 'info');
          break;
        case 10:
          addLog('SEC-TEAM', '🛡️ Containment Analysis: Attack Blast-Radius confined 100% to Research Namespace.', 'success');
          addLog('SEC-TEAM', '🎉 VERIFIED: Zero-Trust policies prevented lateral movement and privilege escalation.', 'success');
          addLog('SEC-TEAM', '📄 Report exported as task artifact: security_audit_report_phase7.md', 'info');
          setSimulationState('contained');
          clearInterval(interval);
          break;
        default:
          break;
      }
      step++;
    }, 1500);
  };

  const resetSimulation = () => {
    setSimulationState('idle');
    setNodes(initialNodes);
    setLogs([
      { timestamp: new Date().toTimeString().split(' ')[0], source: 'SYS', message: 'System simulation reset to normal state.', type: 'info' },
      { timestamp: new Date().toTimeString().split(' ')[0], source: 'FW', message: 'Zero-Trust policies restored.', type: 'success' }
    ]);
  };

  // generate dummy packet tracer file for user download
  const downloadPktFile = (e: React.MouseEvent) => {
    e.preventDefault();
    const pktContent = `Cisco Packet Tracer Topology Config Export
Project: Cisco Virtual Internship 2026 - Cyber Security Track
Target Topology: Secure Hybrid Data Center (PRD_cybertrack)
Configuration: 
- Hub VPC Router: Cisco 2911 (configured with 4 Subinterfaces)
- Spoke VPCs: Subnets 10.1.0.0/16, 10.2.0.0/16, 10.3.0.0/16
- VPN Gateway: Cisco ASA 5506-X (External IP 198.51.100.1, Inside 10.10.1.1)
- On-Prem Router: Cisco 2911 (Subnets 10.10.0.0/16)
- IPsec Tunnel: IKEv2 AES-256 SHA-256 ESP

[To open this in Cisco Packet Tracer, create the devices matching above parameters, and load cisco-asa.cfg config file]`;

    const blob = new Blob([pktContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cisco_hybrid_datacenter.pkt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mockCodeFiles[selectedFile]);
    setCopiedStatus(true);
    setTimeout(() => {
      setCopiedStatus(false);
    }, 2000);
  };

  // parser to colorize configuration code strings
  const renderHighlightedCode = (code: string) => {
    return (
      <pre className="repo-code-pre">
        {code.split('\n').map((line, idx) => {
          const trimmed = line.trim();
          
          // Comment highlighting
          if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('!')) {
            return <div key={idx}><span className="code-comment">{line}</span></div>;
          }
          
          // Basic keyword highlight for Terraform/YAML/JSON/ASA
          if (trimmed.startsWith('resource') || trimmed.startsWith('variable') || trimmed.startsWith('output') || trimmed.startsWith('provider')) {
            const parts = line.split('"');
            if (parts.length > 1) {
              return (
                <div key={idx}>
                  <span className="code-keyword">{parts[0]}</span>
                  {parts.slice(1).map((p, i) => i % 2 === 0 ? <span key={i} className="code-resource">"{p}"</span> : <span key={i}>"{p}"</span>)}
                </div>
              );
            }
          }
          
          if (trimmed.startsWith('apiVersion:') || trimmed.startsWith('kind:') || trimmed.startsWith('metadata:') || trimmed.startsWith('spec:')) {
            const parts = line.split(':');
            return (
              <div key={idx}>
                <span className="code-keyword">{parts[0]}:</span>
                <span className="code-string">{parts.slice(1).join(':')}</span>
              </div>
            );
          }

          if (trimmed.startsWith('interface') || trimmed.startsWith('crypto') || trimmed.startsWith('access-list') || trimmed.startsWith('access-group')) {
            const words = line.split(' ');
            return (
              <div key={idx}>
                <span className="code-keyword">{words[0]}</span>{' '}
                <span className="code-property">{words.slice(1).join(' ')}</span>
              </div>
            );
          }
          
          return <div key={idx}>{line}</div>;
        })}
      </pre>
    );
  };

  return (
    <div className="container">
      {/* Header metrics bar */}
      <header>
        <div className="logo-section">
          <div className="logo-icon">C</div>
          <div className="logo-text">
            <h1>Cisco Hybrid Data Center Simulator</h1>
            <p>Zero-Trust Reference Architecture & Simulation Hub</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {simulationState === 'idle' && (
            <div className="badge badge-success">
              <span className="live-dot"></span> SECURE (Normal Traffic)
            </div>
          )}
          {simulationState === 'running' && (
            <div className="badge badge-danger" style={{ animation: 'pulseRed 1s infinite' }}>
              <span className="live-dot threat"></span> ATTACK IN PROGRESS
            </div>
          )}
          {simulationState === 'contained' && (
            <div className="badge badge-primary">
              <span className="live-dot"></span> THREAT CONTAINED
            </div>
          )}
        </div>
      </header>

      {/* Real-time stats HUD */}
      <div className="stats-hud">
        <div className="stat-card">
          <span className="stat-label">System Integrity</span>
          <span className={`stat-value ${simulationState === 'running' ? 'danger' : simulationState === 'contained' ? 'warning' : 'safe'}`}>
            {simulationState === 'running' ? '14%' : simulationState === 'contained' ? '98%' : '100%'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Containment Actions</span>
          <span className="stat-value">{simulationState === 'idle' ? '0 Filters' : '3 Filters Active'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Transit Latency</span>
          <span className="stat-value">{simulationState === 'running' ? '45 ms' : '12 ms'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tunnel Status</span>
          <span className="stat-value safe">IPsec UP</span>
        </div>
      </div>

      {/* Main visual panel layout */}
      <div className="dashboard-grid">
        
        {/* Left side network layout diagram */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
              Interactive Network Topology (Cisco Packet Tracer Layout)
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Click nodes to view details
            </span>
          </div>

          <div className="network-canvas-container">
            <svg className="network-svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1"/>
                </pattern>
                
                {/* Glow Filters */}
                <filter id="cisco-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="threat-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Dynamic flowing traffic conduits */}
              {/* Path 1: Internet to Hub */}
              <path d="M 103 225 L 262 225" stroke={simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)'} strokeWidth="2.5" className="flowing-path" strokeOpacity="0.8" />
              
              {/* Path 2: Hub to Student */}
              <path d="M 338 225 L 570 105" stroke="var(--cisco-blue)" strokeWidth="2" className={simulationState === 'idle' ? 'flowing-path' : ''} strokeOpacity={simulationState === 'idle' ? 0.8 : 0.25} fill="none" />
              
              {/* Path 3: Hub to Faculty */}
              <path d="M 338 225 L 570 225" stroke="var(--cisco-blue)" strokeWidth="2" className={simulationState === 'idle' ? 'flowing-path' : ''} strokeOpacity={simulationState === 'idle' ? 0.8 : 0.25} fill="none" />
              
              {/* Path 4: Hub to Research */}
              <path d="M 338 225 L 570 345" stroke={simulationState === 'running' ? 'var(--danger)' : 'var(--cisco-blue)'} strokeWidth="2" className="flowing-path" strokeOpacity={simulationState === 'contained' ? 0.25 : 0.8} fill="none" />

              {/* Path 5: Hub to VPN Gateway */}
              <path d="M 300 263 L 225 320" stroke="var(--cisco-blue)" strokeWidth="2" className="flowing-path" strokeOpacity="0.8" fill="none" />
              
              {/* Path 6: VPN Gateway to On-Prem */}
              <path d="M 200 345 L 115 345" stroke="var(--accent-cyan)" strokeWidth="2" className="flowing-path" strokeOpacity="0.8" fill="none" />

              {/* Packet dots flowing along paths */}
              {simulationState === 'idle' && (
                <>
                  <circle r="4.5" fill="var(--success)" filter="url(#cisco-glow)">
                    <animateMotion dur="3.5s" repeatCount="indefinite" path="M 103 225 L 262 225" />
                  </circle>
                  <circle r="4" fill="var(--success)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 338 225 L 570 105" />
                  </circle>
                  <circle r="4.5" fill="var(--accent-cyan)">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 300 263 L 225 320" />
                  </circle>
                  <circle r="4" fill="var(--accent-cyan)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 200 345 L 115 345" />
                  </circle>
                </>
              )}

              {/* Attack flow animation */}
              {simulationState === 'running' && (
                <>
                  <circle r="5" fill="var(--danger)" filter="url(#threat-glow)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 103 225 L 262 225" />
                  </circle>
                  <circle r="5" fill="var(--danger)" filter="url(#threat-glow)">
                    <animateMotion dur="1.4s" repeatCount="indefinite" path="M 338 225 L 570 345" />
                  </circle>
                  {/* Blocked attempts bouncing from Research spoke */}
                  <circle r="4" fill="var(--danger)">
                    <animateMotion dur="1s" repeatCount="indefinite" path="M 570 345 L 437.5 285" />
                  </circle>
                </>
              )}

              {/* Firewall / Filter Block Check indicators */}
              {simulationState === 'running' && (
                <>
                  {/* block between Hub and Student */}
                  <circle cx="437.5" cy="285" r="7" fill="var(--danger)" />
                  {/* block between Hub and Faculty/Exam */}
                  <circle cx="437.5" cy="345" r="7" fill="var(--danger)" />
                </>
              )}

              {/* Contained shield overlay on Research Spoke */}
              {simulationState === 'contained' && (
                <g>
                  <circle cx="660" cy="345" r="42" fill="none" stroke="var(--success)" strokeWidth="2.5" className="shield-ring" />
                  <circle cx="660" cy="345" r="54" fill="none" stroke="var(--success)" strokeWidth="1.5" className="shield-ring" style={{ animationDelay: '0.6s' }} />
                </g>
              )}

              {/* 1. Public Internet Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'internet') || null)}>
                <circle cx="75" cy="225" r="28" fill="#080e1a" stroke="var(--accent-cyan)" strokeWidth="2" filter="url(#cisco-glow)" />
                {/* Globe arcs */}
                <ellipse cx="75" cy="225" rx="28" ry="10" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <ellipse cx="75" cy="225" rx="10" ry="28" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <line x1="47" y1="225" x2="103" y2="225" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <line x1="75" y1="197" x2="75" y2="253" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <text x="75" y="272" textAnchor="middle">Public Internet</text>
              </g>

              {/* 2. On-Prem Data Center Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'onprem') || null)}>
                <rect x="35" y="315" width="80" height="60" rx="8" fill="#080e1a" stroke="var(--accent-cyan)" strokeWidth="2" />
                {/* server chassis drawers */}
                <rect x="43" y="323" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="328" r="2.5" fill="var(--success)" />
                <rect x="43" y="337" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="342" r="2.5" fill="var(--success)" />
                <rect x="43" y="351" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="356" r="2.5" fill="var(--success)" />
                <text x="75" y="396" textAnchor="middle">Private DC Core</text>
              </g>

              {/* 3. Cisco ASA Security Gateway */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'vpn') || null)}>
                <circle cx="225" cy="345" r="26" fill="#080e1a" stroke="var(--cisco-blue)" strokeWidth="2" />
                {/* Brickwall firewall representation */}
                <path d="M 213 336 H 237 M 213 344 H 237 M 213 352 H 237 M 219 336 V 344 M 231 336 V 344 M 214 344 V 352 M 225 344 V 352 M 235 344 V 352" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.85" />
                <text x="225" y="390" textAnchor="middle">Cisco ASA VPN</text>
              </g>

              {/* 4. Transit Hub VPC Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'hub') || null)}>
                <circle cx="300" cy="225" r="38" fill="#080e1a" stroke="var(--cisco-blue)" strokeWidth="3" filter="url(#cisco-glow)" />
                {/* Rotating dash ring for inspection */}
                <circle cx="300" cy="225" r="30" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="6,4">
                  <animateTransform attributeName="transform" type="rotate" from="0 300 225" to="360 300 225" dur="12s" repeatCount="indefinite" />
                </circle>
                {/* Central shield/router icon */}
                <path d="M 292 216 L 300 211 L 308 216 L 308 226 C 308 233 300 238 300 238 C 300 238 292 233 292 226 Z" fill="none" stroke="#fff" strokeWidth="2" />
                <text x="300" y="280" textAnchor="middle">Transit Hub VPC</text>
              </g>

              {/* 5. Student Spoke VPC */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'spoke-student') || null)}>
                <rect x="575" y="75" width="170" height="60" rx="8" fill="#080e1a" stroke="var(--cisco-blue)" strokeWidth="2" />
                {/* Cap icon */}
                <path d="M 590 102 L 602 96 L 614 102 L 602 108 Z" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <path d="M 596 105 V 110 A 5 5 0 0 0 608 110 V 105" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <line x1="614" y1="102" x2="614" y2="114" stroke="var(--accent-cyan)" strokeWidth="1" />
                
                <text x="630" y="105" textAnchor="start" fill="#fff" style={{ fontSize: '11px', fontWeight: 'bold' }}>Student Spoke</text>
                <text x="630" y="120" textAnchor="start" style={{ fontSize: '10px' }}>10.1.0.0/16</text>
              </g>

              {/* 6. Faculty Spoke VPC */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'spoke-faculty') || null)}>
                <rect x="575" y="195" width="170" height="60" rx="8" fill="#080e1a" stroke="var(--cisco-blue)" strokeWidth="2" />
                {/* Padlock icon */}
                <rect x="594" y="222" width="14" height="11" rx="1.5" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <path d="M 597 222 V 218 A 3.5 3.5 0 0 1 604 218 V 222" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                
                <text x="630" y="225" textAnchor="start" fill="#fff" style={{ fontSize: '11px', fontWeight: 'bold' }}>Faculty/Exam</text>
                <text x="630" y="240" textAnchor="start" style={{ fontSize: '10px' }}>10.2.0.0/16</text>
              </g>

              {/* 7. Research Spoke VPC */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'spoke-research') || null)}>
                <rect x="575" y="315" width="170" height="60" rx="8" 
                  fill={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'rgba(239, 68, 68, 0.08)' : '#080e1a'} 
                  stroke={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : 'var(--cisco-blue)'} 
                  strokeWidth="2" 
                  className={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'network-node-indicator threat' : ''} />
                {/* Flask icon */}
                <path d="M 598 335 H 608 M 603 335 V 341 L 594 355 A 2.5 2.5 0 0 0 596 359 H 610 A 2.5 2.5 0 0 0 612 355 L 603 341" fill="none" stroke={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : 'var(--accent-cyan)'} strokeWidth="1.5" />
                
                <text x="630" y="345" textAnchor="start" fill={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : '#fff'} style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? '⚠️ Research Spoke' : 'Research Spoke'}
                </text>
                <text x="630" y="360" textAnchor="start" style={{ fontSize: '10px' }}>10.3.0.0/16</text>
              </g>
            </svg>
          </div>

          {/* Node Inspector Details */}
          {selectedNode && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedNode.name}</h3>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selectedNode.ip}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{selectedNode.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedNode.details.map((detail, index) => (
                  <span key={index} style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div className="controls-bar">
            <button className="btn btn-danger" onClick={runAttackSimulation} disabled={simulationState === 'running'}>
              🚀 Run Threat Simulator
            </button>
            <button className="btn btn-secondary" onClick={resetSimulation}>
              🔄 Reset Network
            </button>
            <button className="btn btn-secondary" onClick={downloadPktFile} style={{ marginLeft: 'auto' }}>
              📥 Download .PKT Guide
            </button>
          </div>
        </section>

        {/* Right side logs, configurations & documentation */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="tab-container">
            <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
              Monitor logs
            </button>
            <button className={`tab-btn ${activeTab === 'packet-tracer' ? 'active' : ''}`} onClick={() => setActiveTab('packet-tracer')}>
              Packet Tracer Config
            </button>
            <button className={`tab-btn ${activeTab === 'cisco-mapping' ? 'active' : ''}`} onClick={() => setActiveTab('cisco-mapping')}>
              Cisco Technology Mappings
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {activeTab === 'logs' && (
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-buttons">
                    <span className="term-dot term-close"></span>
                    <span className="term-dot term-min"></span>
                    <span className="term-dot term-max"></span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>audit_log_stream.sh</span>
                </div>
                <div className="terminal-body">
                  {logs.map((log, index) => (
                    <div key={index} className="terminal-line">
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>[{log.timestamp}]</span>
                      <span style={{ 
                        color: log.type === 'danger' ? 'var(--danger)' : 
                               log.type === 'warning' ? 'var(--warning)' : 
                               log.type === 'success' ? 'var(--success)' : 
                               log.type === 'cisco' ? 'var(--cisco-blue)' : '#cbd5e1',
                        fontWeight: log.type === 'danger' || log.type === 'warning' ? 'bold' : 'normal'
                      }}>
                        {log.source}: {log.message}
                      </span>
                    </div>
                  ))}
                  {simulationState === 'running' && (
                    <div className="terminal-input-line">
                      <span style={{ color: 'var(--danger)' }}>$ infiltrating...</span>
                      <span className="terminal-cursor"></span>
                    </div>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}

            {activeTab === 'packet-tracer' && (
              <div className="pkt-info-grid">
                <div className="pkt-card">
                  <h4>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                    1. ASA Configuration
                  </h4>
                  <p>In Packet Tracer, load the <strong>cisco-asa.cfg</strong> commands on the ASA 5506-X CLI to partition the outside spoke interfaces.</p>
                  <ul>
                    <li>Apply Access-Lists on gig1/1.</li>
                    <li>Restricts research subnets from lateral pings.</li>
                  </ul>
                </div>
                <div className="pkt-card">
                  <h4>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    2. ping verification
                  </h4>
                  <p>Check the isolation limits in the CLI panel of the respective client terminal:</p>
                  <ul>
                    <li><strong>Student app {"->"} Student DB</strong>: success</li>
                    <li><strong>Research app {"->"} Student app</strong>: blocked</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'cisco-mapping' && (
              <div className="cisco-mapping-card">
                <div className="mapping-row">
                  <div className="mapping-product">Cisco Secure Firewall</div>
                  <div className="mapping-native">Security Groups / Route Tables</div>
                  <div className="mapping-desc">Blocks traffic between spokes and enforces transit inspection.</div>
                </div>
                <div className="mapping-row">
                  <div className="mapping-product">Cisco ISE</div>
                  <div className="mapping-native">Kubernetes NetworkPolicies</div>
                  <div className="mapping-desc">Restricts pod communications based on cryptographically-secure namespace labels.</div>
                </div>
                <div className="mapping-row">
                  <div className="mapping-product">Cisco ASA (VPN Gateway)</div>
                  <div className="mapping-native">Virtual Private Gateway</div>
                  <div className="mapping-desc">Maintains secure IPsec tunnel links for database nodes.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Code Repository and Policy Explorer */}
      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Zero-Trust Infrastructure Code Explorer (IaC & Policy Repository)
          </div>
          <div className="tab-container" style={{ margin: 0, padding: '3px' }}>
            <button className={`tab-btn ${activeBottomTab === 'iac' ? 'active' : ''}`} onClick={() => setActiveBottomTab('iac')}>
              Terraform & ASA IaC
            </button>
            <button className={`tab-btn ${activeBottomTab === 'sg-rules' ? 'active' : ''}`} onClick={() => setActiveBottomTab('sg-rules')}>
              Security Matrices
            </button>
          </div>
        </div>

        {activeBottomTab === 'iac' && (
          <div className="repo-explorer">
            <div className="repo-sidebar">
              <div className={`repo-item ${selectedFile === 'terraform' ? 'active' : ''}`} onClick={() => setSelectedFile('terraform')}>
                📁 terraform/network.tf
              </div>
              <div className={`repo-item ${selectedFile === 'k8s' ? 'active' : ''}`} onClick={() => setSelectedFile('k8s')}>
                📁 k8s/network-policy.yaml
              </div>
              <div className={`repo-item ${selectedFile === 'iam' ? 'active' : ''}`} onClick={() => setSelectedFile('iam')}>
                📁 iam/workload-identity.json
              </div>
              <div className={`repo-item ${selectedFile === 'ciscoConfig' ? 'active' : ''}`} onClick={() => setSelectedFile('ciscoConfig')}>
                📁 cisco/cisco-asa.cfg
              </div>
            </div>
            
            <div className="repo-content">
              <div className="repo-content-header">
                <span className="repo-filename">{selectedFile === 'terraform' ? 'terraform/network.tf' : selectedFile === 'k8s' ? 'k8s/network-policy.yaml' : selectedFile === 'iam' ? 'iam/workload-identity.json' : 'cisco/cisco-asa.cfg'}</span>
                <button className="btn btn-secondary" onClick={copyToClipboard} style={{ padding: '4px 10px', fontSize: '0.65rem' }}>
                  {copiedStatus ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="repo-code-container">
                {renderHighlightedCode(mockCodeFiles[selectedFile])}
              </div>
            </div>
          </div>
        )}

        {activeBottomTab === 'sg-rules' && (
          <div className="policy-table-container">
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Source Spoke / IP</th>
                  <th>Destination Spoke / IP</th>
                  <th>Allowed Protocol/Port</th>
                  <th>Default Action</th>
                  <th>Security Enforcer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SG-01</td>
                  <td>Student App (10.1.1.0/24)</td>
                  <td>Student DB (10.1.2.10)</td>
                  <td>TCP / 5432</td>
                  <td style={{ color: 'var(--success)' }}>ALLOW</td>
                  <td>AWS Security Group / K8s policy</td>
                </tr>
                <tr>
                  <td>SG-02</td>
                  <td>Research App (10.3.1.0/24)</td>
                  <td>Student Spoke (10.1.0.0/16)</td>
                  <td>Any</td>
                  <td style={{ color: 'var(--danger)' }}>DENY</td>
                  <td>Cisco Secure Firewall Virtual</td>
                </tr>
                <tr>
                  <td>SG-03</td>
                  <td>Faculty App (10.2.1.0/24)</td>
                  <td>Exam DB (10.2.2.10)</td>
                  <td>TCP / 3306</td>
                  <td style={{ color: 'var(--success)' }}>ALLOW</td>
                  <td>K8s NetworkPolicy</td>
                </tr>
                <tr>
                  <td>SG-04</td>
                  <td>Research Spoke (10.3.0.0/16)</td>
                  <td>Private DC (10.10.0.0/16)</td>
                  <td>Any</td>
                  <td style={{ color: 'var(--danger)' }}>DENY</td>
                  <td>Cisco ASA VPN Gateway</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Premium Multi-column Footer */}
      <footer className="footer-container">
        <div className="footer-grid">
          <div className="footer-col brand">
            <div className="footer-logo">Cisco Zero-Trust Portal</div>
            <p>
              Designing and enforcing default-deny routing rules, Kubernetes container micro-segmentation, and secure Cisco ASA IPsec gateway connections.
            </p>
          </div>
          <div className="footer-col links">
            <h4>Quick Anchors</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveBottomTab('iac'); }}>IaC Explorer</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveBottomTab('sg-rules'); }}>Access Policies</a>
            <a href="#" onClick={downloadPktFile}>Packet Tracer (.pkt)</a>
          </div>
          <div className="footer-col info">
            <h4>Intern Credentials</h4>
            <p><strong>Candidate ID:</strong> Cisco-VI-2026-9281</p>
            <p><strong>Focus Area:</strong> Cloud Security & DevSecOps</p>
            <p><strong>System Link:</strong> <span className="status-indicator-green">Tunnel Secured</span></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Cisco Virtual Internship. Verified against Phase 8 project rules.</p>
          <a href="#" onClick={(e) => { e.preventDefault(); resetSimulation(); }}>Restore Security Matrix</a>
        </div>
      </footer>
    </div>
  );
}
