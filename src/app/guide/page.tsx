"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function GuidePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
              <h1 style={{ fontSize: '1.4rem' }}>Usage & Packet Tracer Integration Guide</h1>
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

          <Link href="/" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', textDecoration: 'none' }}>
            ← Back to Simulator
          </Link>
        </div>
      </header>

      {/* Main Guide Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Banner Section */}
        <div className="panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1), rgba(15, 23, 42, 0.6))', border: '1px solid rgba(0, 180, 216, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span className="badge badge-primary">DOCS & MANUAL</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updated August 2026 • Version 2.0</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Mastering the Zero-Trust Architecture
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '850px' }}>
            This comprehensive guide provides step-by-step instructions for operating the interactive web simulation, understanding threat scenarios, and correlating firewall rules with a hands-on <strong>Cisco Packet Tracer</strong> lab environment.
          </p>
        </div>

        {/* 1. Prerequisites */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">1. System Prerequisites</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--cisco-blue)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>🌐 Web Portal Requirements</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
                <li>Node.js v18 or later</li>
                <li>Modern Chromium browser (Chrome / Edge / Firefox)</li>
                <li>SVG & CSS Grid Animation support enabled</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>💻 Cisco Packet Tracer Lab</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
                <li>Cisco Packet Tracer v8.2 or later</li>
                <li>Downloaded <code>.pkt</code> topology file from portal</li>
                <li>Cisco ASA 5506-X Security Gateway CLI access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Web Portal Operating Manual */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">2. Simulator Dashboard Elements</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Interactive Canvas</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                SVG network topology map displaying FastEthernet (<code>fa0/0</code>) and GigabitEthernet (<code>g0/0</code>) port endpoints, real-time packet flow envelopes, and status LEDs.
              </p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Threat Simulator Engine</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Simulates a 6-step lateral movement attack from compromised Research-App host across Transit Hub towards Student Spoke and On-Prem Data Center.
              </p>
            </div>
            <div className="pkt-card">
              <h4 style={{ color: 'var(--cisco-blue)', fontSize: '0.9rem', marginBottom: '6px' }}>🔷 Real-Time Audit Terminal</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                High-performance logging stream outputting syslog security events, ASA ACL drops, and Kubernetes NetworkPolicy container isolation alerts.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Packet Tracer Step-by-Step Lab Setup */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">3. Cisco Packet Tracer Hands-On Correlated Lab</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderLeft: '3px solid var(--cisco-blue)', paddingLeft: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>Step 1: Download & Open .PKT Template</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Click <strong>"Download .PKT Guide"</strong> on the portal dashboard header to obtain the pre-configured Packet Tracer topology file.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>Step 2: Apply Cisco ASA 5506-X Security ACLs</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Open the CLI tab on the Cisco ASA firewall node in Packet Tracer and paste the segmentation rules from our IaC Explorer:
              </p>
              <pre className="repo-code-container" style={{ padding: '1rem', borderRadius: '6px', fontSize: '0.75rem', background: '#090e1a', color: '#38bdf8' }}>
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

            <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>Step 3: Verification Matrix</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Execute the following commands across Packet Tracer host terminals to verify Zero-Trust enforcement:
              </p>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--cisco-blue)' }}>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Target Scenario</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Source Device</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>CLI Command</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>Expected Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Student Local DB Access</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Student App (10.1.1.5)</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>ping 10.1.2.10</td>
                      <td style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 'bold' }}>✅ SUCCESS (Allowed)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>Cross-Spoke Lateral Attempt</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Research Host (10.3.1.15)</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>ping 10.1.1.5</td>
                      <td style={{ padding: '8px 12px', color: 'var(--danger)', fontWeight: 'bold' }}>❌ BLOCKED (ACL Drop)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>IPsec Data Center Link</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>On-Prem Server (10.10.0.4)</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>ping 10.10.1.1</td>
                      <td style={{ padding: '8px 12px', color: 'var(--success)', fontWeight: 'bold' }}>✅ SUCCESS (Tunnel Active)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.85rem', borderRadius: '30px', textDecoration: 'none' }}>
            🚀 Launch Interactive Simulation Engine
          </Link>
        </div>

      </div>
    </div>
  );
}
