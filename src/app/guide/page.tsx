"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export default function GuidePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      if (!contentRef.current) return;

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#04070f' : '#f8fafc',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('Cisco_Zero_Trust_Working_Guideline.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container" data-theme={theme} style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div className="logo-section">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/cisco-logo.png" 
              alt="Cisco Logo" 
              style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', boxShadow: 'var(--shadow-glow)' }} 
            />
            <div className="logo-text">
              <h1 style={{ fontSize: '1.4rem' }}>Working Guideline & Usage Manual</h1>
              <p>Cisco Zero-Trust Hybrid Data Center Simulation</p>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          <button 
            className="btn btn-primary" 
            onClick={handleDownloadPdf}
            disabled={isExporting}
            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isExporting ? '⏳ Generating PDF...' : '📄 Download Guideline (PDF)'}
          </button>

          <Link href="/" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', textDecoration: 'none' }}>
            ← Back to Simulator
          </Link>
        </div>
      </header>

      {/* Main Guide Content (exact parity with WORKING_GUIDELINE.md) */}
      <div ref={contentRef} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', padding: '1rem', borderRadius: '12px', background: 'transparent' }}>
        
        {/* Banner Section */}
        <div className="panel" style={{ padding: '2.5rem', border: '1px solid var(--border-highlight)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span className="badge badge-primary">OFFICIAL WORKING GUIDELINE</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Maintained by Cisco VI Cyber Track Team • Version 2.0</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.85rem', fontWeight: 800 }}>
            📘 Cisco Zero-Trust Hybrid Data Center Simulation
          </h2>
          <p style={{ lineHeight: 1.8, maxWidth: '900px', fontSize: '0.95rem' }}>
            A comprehensive, step-by-step guide for using this web-based simulation portal alongside <strong>Cisco Packet Tracer</strong> to validate a Zero-Trust network architecture.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">📋 Table of Contents</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
            <a href="#section-1" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>1. Prerequisites</a>
            <a href="#section-2" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>2. Getting Started — Web Portal</a>
            <a href="#section-3" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>3. Understanding the Dashboard</a>
            <a href="#section-4" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>4. Running the Threat Simulator</a>
            <a href="#section-5" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>5. Using with Cisco Packet Tracer</a>
            <a href="#section-6" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>6. IaC Explorer & Security Policies</a>
            <a href="#section-7" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>7. Interpreting Visual Indicators</a>
            <a href="#section-8" style={{ color: 'var(--cisco-blue)', textDecoration: 'none' }}>8. Troubleshooting</a>
          </div>
        </div>

        {/* 1. Prerequisites */}
        <div className="panel" id="section-1">
          <div className="panel-header">
            <h3 className="panel-title">1. Prerequisites</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--cisco-blue)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>🌐 Web Simulation Portal</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
                <li><strong>Node.js:</strong> v18 or later</li>
                <li><strong>npm:</strong> v9 or later</li>
                <li><strong>Browser:</strong> Chrome / Edge / Firefox (latest)</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>💻 Cisco Packet Tracer Validation</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
                <li><strong>Cisco Packet Tracer:</strong> v8.2 or later</li>
                <li><strong>.pkt File:</strong> Downloaded from portal</li>
                <li><strong>Cisco ASA 5506-X CLI Access</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Getting Started */}
        <div className="panel" id="section-2">
          <div className="panel-header">
            <h3 className="panel-title">2. Getting Started — Web Portal</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Execute the following commands to initialize local development server:</p>
            <pre className="repo-code-container" style={{ padding: '1.25rem', borderRadius: '8px', fontSize: '0.8rem', lineHeight: 1.6 }}>
{`# Step 1: Clone the Repository
git clone https://github.com/Deo-Mohan/Cisco-Virtual-Internship.git
cd Cisco-Virtual-Internship

# Step 2: Install Dependencies
npm install

# Step 3: Launch Development Server
npm run dev

# Step 4: Open in Browser -> http://localhost:3000`}
            </pre>
          </div>
        </div>

        {/* 3. Understanding Dashboard */}
        <div className="panel" id="section-3">
          <div className="panel-header">
            <h3 className="panel-title">3. Understanding the Dashboard</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Header & Status Badge</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Displays status indicators: 🟢 <code>SECURE</code> (Normal Traffic), 🔴 <code>ATTACK IN PROGRESS</code>, and 🔵 <code>THREAT CONTAINED</code>.
              </p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Real-Time Stats HUD</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Tracks dynamic animated values for System Integrity %, Containment Filters Active, Transit Latency (ms), and IPsec Tunnel Status.
              </p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 SVG Topology Canvas</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Interactive Packet Tracer topology map with interface port labels (<code>fa0/0</code>, <code>g0/0</code>) and animated traffic packet envelopes.
              </p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Monitor Audit Logs</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Terminal console streaming real-time syslog alerts, ASA firewall drops, and Kubernetes NetworkPolicy container isolation logs.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Threat Simulator */}
        <div className="panel" id="section-4">
          <div className="panel-header">
            <h3 className="panel-title">4. Running the Threat Simulator</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Models a 6-step lateral movement attack scenario based on default-deny architecture:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--cisco-blue)' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Step</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Time</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Simulated Security Event</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Enforcement Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>1</td>
                  <td style={{ padding: '8px 12px' }}>0s</td>
                  <td style={{ padding: '8px 12px' }}>SSH Key Compromise in Research-App Container</td>
                  <td style={{ padding: '8px 12px', color: 'var(--danger)' }}>Attacker establishes shell access</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>2</td>
                  <td style={{ padding: '8px 12px' }}>1s</td>
                  <td style={{ padding: '8px 12px' }}>Local Subnet Port Scan (10.3.1.15)</td>
                  <td style={{ padding: '8px 12px', color: 'var(--warning)' }}>Reconnaissance detected by IPS</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>3</td>
                  <td style={{ padding: '8px 12px' }}>2s</td>
                  <td style={{ padding: '8px 12px' }}>Lateral Movement Attempt to Student Spoke (10.1.0.0/16)</td>
                  <td style={{ padding: '8px 12px', color: 'var(--danger)' }}>Unauthorized cross-spoke route</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>4</td>
                  <td style={{ padding: '8px 12px' }}>3s</td>
                  <td style={{ padding: '8px 12px' }}>Cisco ASA Gateway Inspection</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 'bold' }}>BLOCKED by ASA ACL</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>5</td>
                  <td style={{ padding: '8px 12px' }}>4s</td>
                  <td style={{ padding: '8px 12px' }}>Attempted Access to K8s API & Database</td>
                  <td style={{ padding: '8px 12px', color: 'var(--danger)' }}>Egress probe initiated</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>6</td>
                  <td style={{ padding: '8px 12px' }}>5s</td>
                  <td style={{ padding: '8px 12px' }}>K8s NetworkPolicy Containment</td>
                  <td style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 'bold' }}>CONTAINED to Research Namespace</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Packet Tracer Correlated Lab */}
        <div className="panel" id="section-5">
          <div className="panel-header">
            <h3 className="panel-title">5. Using with Cisco Packet Tracer</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderLeft: '3px solid var(--cisco-blue)', paddingLeft: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>Step 1: Download PKT Reference Template</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Click the <strong>"Download .PKT Guide"</strong> button on the portal to download the correlated <code>cisco-zero-trust-topology.pkt</code> template.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>Step 2: Apply ASA 5506-X Micro-Segmentation ACLs</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Open the CLI tab on the ASA node in Packet Tracer and paste the configuration commands:
              </p>
              <pre className="repo-code-container" style={{ padding: '1rem', borderRadius: '6px', fontSize: '0.75rem' }}>
{`! Apply ASA Micro-segmentation Access Control Lists
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
! Block Research -> Student/Faculty lateral movement
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.1.0.0 255.255.0.0
access-list SEGMENTATION-ASA extended deny ip 10.3.0.0 255.255.0.0 10.2.0.0 255.255.0.0
access-list SEGMENTATION-ASA extended permit tcp 10.3.0.0 255.255.0.0 host 10.3.2.10 eq 5432
access-list SEGMENTATION-ASA extended permit ip any any
access-group SEGMENTATION-ASA in interface outside`}
              </pre>
            </div>
          </div>
        </div>

        {/* 6. IaC Explorer & Security Policies */}
        <div className="panel" id="section-6">
          <div className="panel-header">
            <h3 className="panel-title">6. IaC Explorer & Security Policies</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.85rem' }}><code>terraform/network.tf</code></h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hub-and-Spoke VPC network definitions and Transit Gateway routing tables.</p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.85rem' }}><code>k8s/network-policy.yaml</code></h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kubernetes default-deny-all ingress/egress container isolation policies.</p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.85rem' }}><code>iam/workload-identity.json</code></h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>IAM least-privilege service account bindings for container workloads.</p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.85rem' }}><code>cisco/cisco-asa.cfg</code></h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cisco ASA firewall access-lists enforcing cross-spoke traffic blocks.</p>
            </div>
          </div>
        </div>

        {/* 7. Interpreting Visual Indicators */}
        <div className="panel" id="section-7">
          <div className="panel-header">
            <h3 className="panel-title">7. Interpreting Visual Indicators</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '6px' }}>Envelope Colors</h4>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1rem' }}>
                <li>🟢 <strong>Green:</strong> Normal healthy traffic</li>
                <li>🔵 <strong>Cyan:</strong> VPN/On-Prem tunnel traffic</li>
                <li>🔴 <strong>Red (!):</strong> Threat/attack packets</li>
                <li>🟠 <strong>Orange (X):</strong> Blocked/rejected packets</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '6px' }}>Node LEDs</h4>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1rem' }}>
                <li>🟢 <strong>Green:</strong> Healthy / Active</li>
                <li>🔴 <strong>Red (pulsing):</strong> Attack Compromised</li>
                <li>🟡 <strong>Amber (pulsing):</strong> Contained</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 8. Troubleshooting */}
        <div className="panel" id="section-8">
          <div className="panel-header">
            <h3 className="panel-title">8. Troubleshooting</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--cisco-blue)' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Issue Description</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Recommended Solution</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Animations lag or freeze</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Use a modern Chromium browser (Chrome / Edge) for optimal SVG animation support.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Packet Tracer .pkt file fails to open</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Ensure you are running Cisco Packet Tracer v8.2 or higher.</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>ASA commands rejected in Packet Tracer CLI</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Type <code>enable</code> and then <code>configure terminal</code> before pasting access-list commands.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Link Banner */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 30px', fontSize: '0.85rem', borderRadius: '30px', textDecoration: 'none' }}>
            🚀 Return to Interactive Simulation Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
