"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Smooth counting up/down animated number component
const AnimatedNumber = ({ value, duration = 800, suffix = '', decimals = 0 }: { value: number; duration?: number; suffix?: string; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const currentValue = startValueRef.current + (value - startValueRef.current) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

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

const getDynamicCode = (file: string, policyMode: 'strict' | 'permissive', activeRuleTarget: 'deny-research' | 'allow-db') => {
  if (file === 'terraform') {
    return policyMode === 'strict' 
? `# Hub and Spoke VPC setup for the hybrid data center
# Zero-Trust Strict mode active: routing via Inspection VPC enabled.

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
}

resource "aws_vpc" "research" {
  cidr_block           = "10.3.0.0/16"
  enable_dns_hostnames = true
}

# Peering connections (Hub and Spoke architecture)
resource "aws_vpc_peering_connection" "hub_to_student" {
  vpc_id        = aws_vpc.hub.id
  peer_vpc_id   = aws_vpc.student.id
  auto_accept   = true
}

resource "aws_vpc_peering_connection" "hub_to_research" {
  vpc_id        = aws_vpc.hub.id
  peer_vpc_id   = aws_vpc.research.id
  auto_accept   = true
}

# Zero-Trust Policy: All traffic routed via Transit Gateway (TGW) for firewall inspection
resource "aws_route_table" "spoke_research" {
  vpc_id = aws_vpc.research.id
  
  # Send 0.0.0.0/0 to central Inspection Hub VPC rather than direct peering
  route {
    cidr_block         = "0.0.0.0/0"
    transit_gateway_id = aws_ec2_transit_gateway.hub.id
  }
  
  tags = {
    Name = "rtb-spoke-research-strict"
    Policy = "Transit-Inspection-Required"
  }
}`
: `# Hub and Spoke VPC setup (Permissive/Legacy Mode)
# WARNING: Strict transit gateway micro-segmentation is disabled.

resource "aws_vpc" "hub" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_vpc" "student" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_vpc" "research" {
  cidr_block           = "10.3.0.0/16"
  enable_dns_hostnames = true
}

# Permissive direct routing bypassing Central Inspection Hub
resource "aws_route_table" "spoke_research" {
  vpc_id = aws_vpc.research.id

  # Direct routing between spokes allowed without firewall filter
  route {
    cidr_block                = "10.1.0.0/16" # Student Subnet
    vpc_peering_connection_id = aws_vpc_peering_connection.hub_to_student.id
  }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.direct_internet.id
  }

  tags = {
    Name = "rtb-spoke-research-permissive"
    Policy = "Direct-Uninspected"
  }
}`;
  }

  if (file === 'k8s') {
    return policyMode === 'strict'
? `# K8s network policy to isolate our pods
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
      port: 53`
: `# K8s network policy (Permissive/Default-Allow Mode)
# WARNING: Namespace isolation and lateral restrictions are disabled.

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-all-ingress-egress
  namespace: research
spec:
  podSelector: {} # Selects all workloads
  ingress:
  - {} # Allows traffic from any namespace/pod
  egress:
  - {} # Allows egress to any namespace/pod
  policyTypes:
  - Ingress
  - Egress`;
  }

  if (file === 'iam') {
    return policyMode === 'strict'
? `# IAM configuration for pods (Workload Identity)
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
}`
: `# IAM configuration (Permissive Wildcard Access)
# WARNING: Violates Principle of Least Privilege.

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PermissiveSandboxAccess",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}`;
  }

  // ciscoConfig
  return activeRuleTarget === 'deny-research'
? `! Cisco ASA Firewall configurations
! ENFORCE ISOLATION: access-list denies research spoke transit

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
! permit other general internet and db connections
access-list SEGMENTATION-ASA extended permit tcp 10.3.0.0 255.255.0.0 host 10.3.2.10 eq 5432
access-list SEGMENTATION-ASA extended permit ip any any
! bind access control list to outside interface
access-group SEGMENTATION-ASA in interface outside`
: `! Cisco ASA Firewall configurations
! AUTHORIZE ACCESS: permit database traffic specifically

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
! Explicit permit rule for Student App pods to access local master database
access-list DATABASE-ASA extended permit tcp 10.1.0.0 255.255.0.0 host 10.10.2.10 eq 5432
! Deny all other databases ingress from spokes
access-list DATABASE-ASA extended deny tcp any host 10.10.2.10 eq 5432
access-list DATABASE-ASA extended permit ip any any
! Bind to GigabitEthernet1/1 interface
access-group DATABASE-ASA in interface outside`;
};

const getPillStyle = (detail: string, index: number) => {
  const text = detail.toLowerCase();
  let bg = 'rgba(0, 180, 216, 0.06)';
  let border = 'rgba(0, 180, 216, 0.15)';
  let color = 'var(--accent-cyan)';
  
  if (text.includes('deny') || text.includes('block') || text.includes('restrict') || text.includes('isolate') || text.includes('firewall') || text.includes('threat')) {
    bg = 'rgba(239, 68, 68, 0.08)';
    border = 'rgba(239, 68, 68, 0.2)';
    color = 'var(--danger)';
  } else if (text.includes('allow') || text.includes('permit') || text.includes('safe') || text.includes('success') || text.includes('log') || text.includes('gateway') || text.includes('transit')) {
    bg = 'rgba(16, 185, 129, 0.08)';
    border = 'rgba(16, 185, 129, 0.2)';
    color = 'var(--success)';
  } else if (text.includes('db') || text.includes('database') || text.includes('sql') || text.includes('subnet') || text.includes('policy') || text.includes('identity')) {
    bg = 'rgba(139, 92, 246, 0.08)';
    border = 'rgba(139, 92, 246, 0.2)';
    color = '#a78bfa';
  } else {
    const colors = [
      { bg: 'rgba(0, 180, 216, 0.06)', border: 'rgba(0, 180, 216, 0.15)', color: 'var(--cisco-blue)' },
      { bg: 'rgba(6, 182, 212, 0.06)', border: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' },
      { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }
    ];
    const picked = colors[index % colors.length];
    bg = picked.bg;
    border = picked.border;
    color = picked.color;
  }
  
  return {
    fontSize: '0.62rem',
    fontWeight: '700' as const,
    padding: '3px 8px',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '50px',
    color: color,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    boxShadow: `0 1px 3px ${bg}`
  };
};

export default function Home() {
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(initialNodes[3]); // hub vpc selected first
  const [activeTab, setActiveTab] = useState<'logs' | 'packet-tracer' | 'cisco-mapping'>('logs');
  const [activeBottomTab, setActiveBottomTab] = useState<'iac' | 'sg-rules' | 'k8s-policies'>('iac');
  const [selectedFile, setSelectedFile] = useState<'terraform' | 'k8s' | 'iam' | 'ciscoConfig'>('terraform');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [policyMode, setPolicyMode] = useState<'strict' | 'permissive'>('strict');
  const [activeRuleTarget, setActiveRuleTarget] = useState<'deny-research' | 'allow-db'>('deny-research');
  const [metricsHistory, setMetricsHistory] = useState<number[]>([15, 22, 18, 14, 16, 25, 18, 20, 24, 28, 22, 19, 21, 26, 23]);

  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'contained'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: '13:46:02', source: 'SYS', message: 'Zero-Trust Hybrid Data Center security monitor online.', type: 'info' },
    { timestamp: '13:46:05', source: 'VPN', message: 'IPsec tunnel established with Private Data Center 10.10.0.0/16.', type: 'success' },
    { timestamp: '13:46:10', source: 'K8S', message: 'Kubernetes NetworkPolicies synchronized across 4 namespaces.', type: 'info' },
    { timestamp: '13:46:15', source: 'FW', message: 'Cisco Secure Firewall virtual appliance reports 0 active violations.', type: 'success' }
  ]);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Dynamic code files configuration
  const mockCodeFiles = {
    terraform: getDynamicCode('terraform', policyMode, activeRuleTarget),
    k8s: getDynamicCode('k8s', policyMode, activeRuleTarget),
    iam: getDynamicCode('iam', policyMode, activeRuleTarget),
    ciscoConfig: getDynamicCode('ciscoConfig', policyMode, activeRuleTarget)
  };

  // auto scroll logs to bottom — only scroll the terminal container, NOT the whole page
  useEffect(() => {
    if (consoleEndRef.current?.parentElement) {
      const container = consoleEndRef.current.parentElement;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  // Real-time Firewall Telemetry history ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsHistory((prev) => {
        let nextVal = 0;
        if (simulationState === 'idle') {
          nextVal = Math.floor(Math.random() * 15) + 15; // 15-30
        } else if (simulationState === 'running') {
          nextVal = Math.floor(Math.random() * 60) + 90; // 90-150 (breach spikes)
        } else {
          nextVal = Math.floor(Math.random() * 10) + 12; // 12-22 (contained)
        }
        return [...prev.slice(1), nextVal];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [simulationState]);

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
          <img 
            src="/cisco-logo.png" 
            alt="Cisco Zero-Trust Logo" 
            style={{ width: '54px', height: '54px', borderRadius: '12px', objectFit: 'cover', boxShadow: 'var(--shadow-glow)' }} 
          />
          <div className="logo-text">
            <h1>Cisco Hybrid Data Center Simulator</h1>
            <p>Zero-Trust Reference Architecture & Simulation Hub</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link 
            href="/guide" 
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '20px', textDecoration: 'none', background: 'rgba(0, 180, 216, 0.1)', color: 'var(--cisco-blue)', borderColor: 'rgba(0, 180, 216, 0.3)' }}
          >
            📘 Usage Guide
          </Link>

          <button 
            className="btn btn-secondary" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          
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
            <AnimatedNumber value={simulationState === 'running' ? 14 : simulationState === 'contained' ? 98 : 100} suffix="%" />
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Containment Actions</span>
          <span className="stat-value">
            <AnimatedNumber value={simulationState === 'idle' ? 0 : 3} suffix={simulationState === 'idle' ? ' Filters' : ' Filters Active'} />
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Transit Latency</span>
          <span className="stat-value">
            <AnimatedNumber value={simulationState === 'running' ? 45 : 12} suffix=" ms" />
          </span>
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
                <filter id="cisco-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="threat-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Path Gradients */}
                <linearGradient id="cyan-to-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" />
                  <stop offset="100%" stopColor="var(--cisco-blue)" />
                </linearGradient>
                <linearGradient id="blue-to-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--cisco-blue)" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Dynamic flowing traffic conduits */}
              {/* Path 1: Internet to Hub (Solid public fiber line) */}
              <path d="M 103 225 L 262 225" stroke={simulationState === 'running' ? 'var(--danger)' : 'url(#cyan-to-blue)'} strokeWidth="2.5" strokeOpacity="0.85" fill="none" />
              
              {/* Path 2: Hub to Student (Dashed virtual peering) */}
              <path d="M 338 225 Q 480 120 640 80" stroke="var(--cisco-blue)" strokeWidth="2" className={simulationState === 'idle' ? 'flowing-path' : ''} strokeOpacity={simulationState === 'idle' ? 0.8 : 0.25} fill="none" />
              
              {/* Path 3: Hub to Faculty (Dashed virtual peering) */}
              <path d="M 338 225 L 640 225" stroke="var(--cisco-blue)" strokeWidth="2" className={simulationState === 'idle' ? 'flowing-path' : ''} strokeOpacity={simulationState === 'idle' ? 0.8 : 0.25} fill="none" />
              
              {/* Path 4: Hub to Research (Dashed virtual peering) */}
              <path d="M 338 225 Q 480 330 640 370" stroke={simulationState === 'running' ? 'var(--danger)' : 'var(--cisco-blue)'} strokeWidth="2" className="flowing-path" strokeOpacity={simulationState === 'contained' ? 0.25 : 0.8} fill="none" />

              {/* Path 5: Hub to VPN Gateway (Dashed VPN tunnel overlay) */}
              <path d="M 300 263 Q 260 285 225 319" stroke="var(--cisco-blue)" strokeWidth="2" className="flowing-path" strokeOpacity="0.8" fill="none" />
              
              {/* Path 6: VPN Gateway to On-Prem (Solid physical LAN fiber line) */}
              <path d="M 199 345 L 115 345" stroke="url(#blue-to-cyan)" strokeWidth="2.5" strokeOpacity="0.85" fill="none" />

              {/* Cisco Packet Tracer style envelope packets */}
              {simulationState === 'idle' && (
                <>
                  {/* Envelope: Internet → Hub */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 103 225 L 262 225" />
                    <rect x="-8" y="-6" width="16" height="12" rx="2" fill="var(--success)" />
                    <path d="M -8 -6 L 0 1 L 8 -6" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                  </g>

                  {/* Envelope: Hub → Student */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 338 225 Q 480 120 640 80" />
                    <rect x="-8" y="-6" width="16" height="12" rx="2" fill="var(--success)" />
                    <path d="M -8 -6 L 0 1 L 8 -6" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                  </g>

                  {/* Envelope: Hub → Faculty */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="3.2s" repeatCount="indefinite" path="M 338 225 L 640 225" />
                    <rect x="-8" y="-6" width="16" height="12" rx="2" fill="var(--success)" />
                    <path d="M -8 -6 L 0 1 L 8 -6" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                  </g>

                  {/* Envelope: Hub → Research */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 338 225 Q 480 330 640 370" />
                    <rect x="-8" y="-6" width="16" height="12" rx="2" fill="var(--success)" />
                    <path d="M -8 -6 L 0 1 L 8 -6" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                  </g>

                  {/* Envelope: VPN → Hub */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 225 319 Q 260 285 300 263" />
                    <rect x="-7" y="-5" width="14" height="10" rx="2" fill="var(--accent-cyan)" />
                    <path d="M -7 -5 L 0 1 L 7 -5" fill="none" stroke="#080e1a" strokeWidth="1.2" />
                  </g>

                  {/* Envelope: On-Prem → VPN */}
                  <g filter="url(#cisco-glow)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 115 345 L 199 345" />
                    <rect x="-7" y="-5" width="14" height="10" rx="2" fill="var(--accent-cyan)" />
                    <path d="M -7 -5 L 0 1 L 7 -5" fill="none" stroke="#080e1a" strokeWidth="1.2" />
                  </g>
                </>
              )}

              {/* Attack flow — red threat envelopes */}
              {simulationState === 'running' && (
                <>
                  {/* Threat Envelope: Internet → Hub */}
                  <g filter="url(#threat-glow)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path="M 103 225 L 262 225" />
                    <rect x="-9" y="-7" width="18" height="14" rx="2" fill="var(--danger)" />
                    <path d="M -9 -7 L 0 2 L 9 -7" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">!</text>
                  </g>

                  {/* Threat Envelope: Hub → Research */}
                  <g filter="url(#threat-glow)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 338 225 Q 480 330 640 370" />
                    <rect x="-9" y="-7" width="18" height="14" rx="2" fill="var(--danger)" />
                    <path d="M -9 -7 L 0 2 L 9 -7" fill="none" stroke="#080e1a" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">!</text>
                  </g>

                  {/* Blocked bounce-back from Research */}
                  <g filter="url(#threat-glow)" opacity="0.85">
                    <animateMotion dur="2.0s" repeatCount="indefinite" path="M 640 370 Q 520 330 460 290" />
                    <rect x="-8" y="-6" width="16" height="12" rx="2" fill="#f97316" />
                    <path d="M -8 -6 L 0 1 L 8 -6" fill="none" stroke="#080e1a" strokeWidth="1.2" />
                    <line x1="-5" y1="-4" x2="5" y2="4" stroke="#fff" strokeWidth="2" />
                    <line x1="5" y1="-4" x2="-5" y2="4" stroke="#fff" strokeWidth="2" />
                  </g>
                </>
              )}

              {/* Firewall / Filter Block Check indicators */}
              {simulationState === 'running' && (
                <>
                  {/* block between Hub and Student */}
                  <g filter="url(#threat-glow)" className="live-ticking-dot">
                    <circle cx="490" cy="155" r="8" fill="var(--danger)" />
                    <line x1="486.5" y1="155" x2="493.5" y2="155" stroke="#fff" strokeWidth="2" />
                  </g>
                  {/* block between Hub and Faculty/Exam */}
                  <g filter="url(#threat-glow)" className="live-ticking-dot">
                    <circle cx="490" cy="225" r="8" fill="var(--danger)" />
                    <line x1="486.5" y1="225" x2="493.5" y2="225" stroke="#fff" strokeWidth="2" />
                  </g>
                </>
              )}

              {/* Contained shield overlay on Research Spoke */}
              {simulationState === 'contained' && (
                <g>
                  <circle cx="715" cy="370" r="42" fill="none" stroke="var(--success)" strokeWidth="2.5" className="shield-ring" />
                  <circle cx="715" cy="370" r="54" fill="none" stroke="var(--success)" strokeWidth="1.5" className="shield-ring" style={{ animationDelay: '0.6s' }} />
                </g>
              )}

              {/* Cisco Packet Tracer — endpoint interface labels & link-light dots */}
              <g className="cisco-link-decorations" style={{ fontSize: '7.5px', fontFamily: 'var(--font-mono)', fill: 'rgba(255, 255, 255, 0.4)' }}>
                {/* Internet endpoint */}
                <circle cx="116" cy="225" r="2.5" fill="var(--success)" />
                <text x="116" y="214" textAnchor="middle">fa0/0</text>

                {/* Student Spoke endpoint */}
                <circle cx="633" cy="83" r="2.5" fill="var(--success)" />
                <text x="623" y="74" textAnchor="end">fa0/1</text>

                {/* Faculty/Exam endpoint */}
                <circle cx="633" cy="225" r="2.5" fill="var(--success)" />
                <text x="623" y="216" textAnchor="end">fa0/1</text>

                {/* Research Spoke endpoint — dynamic status */}
                <circle cx="633" cy="369" r="2.5" 
                  fill={simulationState === 'running' ? 'var(--danger)' : simulationState === 'contained' ? 'var(--warning)' : 'var(--success)'} 
                  className={simulationState !== 'idle' ? 'live-ticking-dot' : ''} />
                <text x="623" y="360" textAnchor="end">fa0/1</text>

                {/* VPN Gateway endpoint */}
                <circle cx="239" cy="325" r="2.5" fill="var(--success)" />
                <text x="248" y="317" textAnchor="start">g0/0</text>

                {/* On-Prem DC endpoint */}
                <circle cx="123" cy="345" r="2.5" fill="var(--success)" />
                <text x="133" y="336" textAnchor="start">fa0/0</text>
              </g>

              {/* 1. Public Internet Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'internet') || null)}>
                <circle cx="75" cy="225" r="36" fill="rgba(0, 180, 216, 0.05)" filter="url(#cisco-glow)" />
                <circle cx="75" cy="225" r="28" fill="var(--node-bg)" stroke="var(--accent-cyan)" strokeWidth="2" />
                {/* Globe arcs */}
                <ellipse cx="75" cy="225" rx="28" ry="10" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <ellipse cx="75" cy="225" rx="10" ry="28" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <line x1="47" y1="225" x2="103" y2="225" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <line x1="75" y1="197" x2="75" y2="253" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
                <text x="75" y="275" textAnchor="middle">Public Internet</text>
              </g>

              {/* 2. On-Prem Data Center Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'onprem') || null)}>
                <rect x="35" y="315" width="80" height="60" rx="8" fill="var(--node-bg)" stroke="var(--accent-cyan)" strokeWidth="2" />
                {/* server chassis drawers */}
                <rect x="43" y="323" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="328" r="2" fill="var(--success)">
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="95" cy="328" r="1.5" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" />
                </circle>
                
                <rect x="43" y="337" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="342" r="2" fill="var(--success)">
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="95" cy="342" r="1.5" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.1;1;0.1" dur="0.9s" repeatCount="indefinite" />
                </circle>

                <rect x="43" y="351" width="64" height="10" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
                <circle cx="49" cy="356" r="2" fill="var(--success)">
                  <animate attributeName="opacity" values="1;0.1;1" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle cx="95" cy="356" r="1.5" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="0.4s" repeatCount="indefinite" />
                </circle>

                <text x="75" y="396" textAnchor="middle">Private DC Core</text>
              </g>

              {/* 3. Cisco ASA Security Gateway */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'vpn') || null)}>
                <circle cx="225" cy="345" r="26" fill="var(--node-bg)" stroke="var(--cisco-blue)" strokeWidth="2" />
                <circle cx="225" cy="345" r="31" fill="none" stroke="rgba(0, 180, 216, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                {/* Brickwall firewall representation */}
                <path d="M 213 336 H 237 M 213 344 H 237 M 213 352 H 237 M 219 336 V 344 M 231 336 V 344 M 214 344 V 352 M 225 344 V 352 M 235 344 V 352" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.85" />
                <text x="225" y="390" textAnchor="middle">Cisco ASA VPN</text>
              </g>

              {/* 4. Transit Hub VPC Node */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'hub') || null)}>
                {/* Expanding sonar radar sweeps */}
                <circle cx="300" cy="225" r="38" fill="none" stroke="var(--cisco-blue)" strokeWidth="1.5" opacity="0.8">
                  <animate attributeName="r" values="38;70;38" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="225" r="48" fill="rgba(0, 180, 216, 0.12)" filter="url(#cisco-glow)" />
                <circle cx="300" cy="225" r="38" fill="var(--node-bg)" stroke="var(--cisco-blue)" strokeWidth="3" />
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
                <rect x="640" y="50" width="150" height="60" rx="8" fill="var(--node-bg)" stroke="var(--cisco-blue)" strokeWidth="2" />
                {/* Status indicator LED in spoke */}
                <circle cx="778" cy="62" r="3" fill="var(--success)" className="live-ticking-dot" />
                {/* Cap icon */}
                <path d="M 655 77 L 667 71 L 679 77 L 667 83 Z" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <path d="M 661 80 V 85 A 5 5 0 0 0 673 85 V 80" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <line x1="679" y1="77" x2="679" y2="89" stroke="var(--accent-cyan)" strokeWidth="1" />
                
                <text x="695" y="78" textAnchor="start" fill="#fff" style={{ fontSize: '11px', fontWeight: 'bold' }}>Student Spoke</text>
                <text x="695" y="93" textAnchor="start" style={{ fontSize: '10px' }}>10.1.0.0/16</text>
              </g>

              {/* 6. Faculty Spoke VPC */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'spoke-faculty') || null)}>
                <rect x="640" y="195" width="150" height="60" rx="8" fill="var(--node-bg)" stroke="var(--cisco-blue)" strokeWidth="2" />
                {/* Status indicator LED in spoke */}
                <circle cx="778" cy="207" r="3" fill="var(--success)" className="live-ticking-dot" />
                {/* Padlock icon */}
                <rect x="659" y="222" width="14" height="11" rx="1.5" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <path d="M 662 222 V 218 A 3.5 3.5 0 0 1 669 218 V 222" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                
                <text x="695" y="225" textAnchor="start" fill="#fff" style={{ fontSize: '11px', fontWeight: 'bold' }}>Faculty/Exam</text>
                <text x="695" y="240" textAnchor="start" style={{ fontSize: '10px' }}>10.2.0.0/16</text>
              </g>

              {/* 7. Research Spoke VPC */}
              <g className="network-node" onClick={() => setSelectedNode(nodes.find(n => n.id === 'spoke-research') || null)}>
                <rect x="640" y="340" width="155" height="60" rx="8" 
                  fill={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'rgba(239, 68, 68, 0.15)' : 'var(--node-bg)'} 
                  stroke={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : 'var(--cisco-blue)'} 
                  strokeWidth="2" 
                  className={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'network-node-indicator threat' : ''} />
                {/* Status indicator LED in Research spoke */}
                <circle cx="778" cy="352" r="3" 
                  fill={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : simulationState === 'contained' ? 'var(--warning)' : 'var(--success)'} 
                  className="live-ticking-dot" />
                {/* Flask icon */}
                <path d="M 663 360 H 673 M 668 360 V 366 L 659 380 A 2.5 2.5 0 0 0 661 384 H 675 A 2.5 2.5 0 0 0 677 380 L 668 366" fill="none" stroke={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : 'var(--accent-cyan)'} strokeWidth="1.5" />
                
                <text x="695" y="370" textAnchor="start" fill={nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? 'var(--danger)' : '#fff'} style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {nodes.find(n => n.id === 'spoke-research')?.status === 'threat' ? '⚠️ Research Spoke' : 'Research Spoke'}
                </text>
                <text x="695" y="385" textAnchor="start" style={{ fontSize: '10px' }}>10.3.0.0/16</text>
              </g>
            </svg>
          </div>

          {/* Responsive Node Inspector & Live Security Metrics Grid */}
          <div className="inspector-telemetry-grid">
            {/* Node Inspector Details */}
            {selectedNode ? (() => {
              let accentColor = 'var(--cisco-blue)';
              if (selectedNode.id === 'spoke-research') {
                accentColor = selectedNode.status === 'threat' ? 'var(--danger)' : 'var(--warning)';
              } else if (selectedNode.id === 'spoke-student') {
                accentColor = 'var(--accent-cyan)';
              } else if (selectedNode.id === 'internet') {
                accentColor = '#94a3b8';
              } else if (selectedNode.id === 'vpn' || selectedNode.id === 'onprem') {
                accentColor = 'var(--accent-cyan)';
              }
              
              return (
                <div style={{ padding: '1rem 1rem 1rem 1.25rem', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)', border: '1px solid rgba(255, 255, 255, 0.07)', borderLeft: `3.5px solid ${accentColor}`, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontWeight: '700' }}>{selectedNode.name}</h3>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{selectedNode.ip}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.45' }}>{selectedNode.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                    {selectedNode.details.map((detail, index) => (
                      <span key={index} style={getPillStyle(detail, index)}>
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '1rem 1rem 1rem 1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderLeft: '3.5px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '130px' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Node Inspector</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                  Click on any node in the topology map above to inspect its live routing configuration, security group details, and IP address boundaries.
                </p>
              </div>
            )}

            {/* Live Security Metrics & Threat Telemetry */}
            <div className="metrics-panel-glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="live-pulse-indicator" style={{ color: simulationState === 'running' ? 'var(--danger)' : simulationState === 'contained' ? 'var(--success)' : 'var(--accent-cyan)', background: 'currentColor' }}></span>
                  <h4 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Live Firewall Telemetry</h4>
                </div>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>IPS: Active</span>
              </div>
              
              {/* Quick Metrics HUD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Inspected Traffic</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    <AnimatedNumber value={metricsHistory[metricsHistory.length - 1] || 0} suffix=" p/s" />
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Blocked Threats</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: simulationState !== 'idle' ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <AnimatedNumber value={simulationState === 'idle' ? 0 : simulationState === 'running' ? 28 : 42} />
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>CPU Load</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: simulationState === 'running' ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    <AnimatedNumber value={simulationState === 'idle' ? 4.8 : simulationState === 'running' ? 82.4 : 12.1} decimals={1} suffix="%" />
                  </div>
                </div>
              </div>

              {/* SVG Sparkline Area Graph */}
              <div style={{ height: '65px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '4px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 300 65" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)'} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Horizontal Grid Lines */}
                  <line x1="0" y1="16" x2="300" y2="16" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                  <line x1="0" y1="32" x2="300" y2="32" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                  <line x1="0" y1="48" x2="300" y2="48" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                  
                  {/* Area under curve */}
                  <path
                    d={`M 0 65 ${metricsHistory.map((val, idx) => `L ${(idx * 300) / 14} ${65 - (val / 160) * 55}`).join(' ')} L 300 65 Z`}
                    fill="url(#metricGrad)"
                  />
                  
                  {/* Curve Line */}
                  <path
                    d={metricsHistory.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${(idx * 300) / 14} ${65 - (val / 160) * 55}`).join(' ')}
                    fill="none"
                    stroke={simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)'}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.4s ease' }}
                  />

                  {/* Pulsing endpoint dot */}
                  <circle
                    cx="300"
                    cy={65 - (metricsHistory[metricsHistory.length - 1] / 160) * 55}
                    r="3.5"
                    fill={simulationState === 'running' ? 'var(--danger)' : 'var(--accent-cyan)'}
                    className="live-ticking-dot"
                  />
                </svg>
              </div>
            </div>
          </div>

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
                               log.type === 'cisco' ? 'var(--cisco-blue)' : 'var(--text-secondary)',
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
          <>
            {/* Interactive IaC Policy Customizer Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderBottom: 'none', borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ fontSize: '0.8rem', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>IaC Policy Customizer</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Configure Zero-Trust environment variables and observe real-time policy configuration updates below.</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                {/* Security Mode Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="secLevel" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Level:</label>
                  <select
                    id="secLevel"
                    value={policyMode}
                    onChange={(e) => {
                      setPolicyMode(e.target.value as any);
                      addLog('SYS', `IaC Policy: Changed Security Level to ${e.target.value === 'strict' ? 'STRICT ZERO-TRUST' : 'PERMISSIVE LEGACY'}.`, 'info');
                    }}
                    style={{ background: '#070b14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="strict">Strict Zero-Trust (Default-Deny)</option>
                    <option value="permissive">Permissive Routing (Bypass FW)</option>
                  </select>
                </div>
                {/* Rule Focus Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="ruleFocus" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ASA Rule Target:</label>
                  <select
                    id="ruleFocus"
                    value={activeRuleTarget}
                    onChange={(e) => {
                      setActiveRuleTarget(e.target.value as any);
                      addLog('SYS', `IaC Policy: Updated Cisco ASA active access-group rules to target "${e.target.value}".`, 'info');
                    }}
                    style={{ background: '#070b14', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="deny-research">Isolate Research Spoke</option>
                    <option value="allow-db">Authorize Student DB Access</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="repo-explorer" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
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
          </>
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
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/cisco-logo.png" alt="Cisco Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Cisco Zero-Trust Portal</span>
            </div>
            <p>
              Designing and enforcing default-deny routing rules, Kubernetes container micro-segmentation, and secure Cisco ASA IPsec gateway connections.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <a href="https://github.com/Deo-Mohan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-cyan)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/krishna-mohan-kumar/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#0a66c2')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
          <div className="footer-col links">
            <h4>Quick Anchors</h4>
            <Link href="/guide">📘 Usage Guide</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveBottomTab('iac'); }}>📂 IaC Explorer</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveBottomTab('sg-rules'); }}>🔒 Access Policies</a>
            <a href="#" onClick={downloadPktFile}>📥 Packet Tracer (.pkt)</a>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>⬆️ Back to Top</a>
          </div>
          <div className="footer-col info">
            <h4>Intern Credentials</h4>
            <p><strong>Candidate Name:</strong> Krishna Mohan</p>
            <p><strong>Focus Area:</strong> Cloud Security & DevSecOps</p>
            <p><strong>System Link:</strong> <span className="status-indicator-green">Tunnel Secured</span></p>
            <p style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Built with Next.js • React • SVG Animation Engine</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Cisco Virtual Internship — | Designed & Built With ❤️ by <strong>Krishna Mohan</strong></p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); resetSimulation(); }}>🔁 Restore Security Matrix</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              <span>Powered by</span>
              <img src="/cisco-logo.svg" alt="Cisco Official Logo" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
