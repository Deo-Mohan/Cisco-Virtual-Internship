import type { Metadata } from "next";
import { Outfit, Fira_Code } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cisco Zero-Trust Hybrid Data Center Simulation | Cyber Security Track 2026",
  description: "Interactive security simulation, policy-as-code explorer, and Cisco Packet Tracer visualization of the Zero-Trust Hub-and-Spoke Hybrid Data Center Architecture by Krishna Mohan.",
  keywords: ["Cisco", "Zero-Trust", "Cyber Security", "Packet Tracer", "Terraform", "Kubernetes", "ASA Firewall", "Hybrid Data Center", "DevSecOps", "Cloud Security"],
  authors: [{ name: "Krishna Mohan", url: "https://www.linkedin.com/in/krishna-mohan-kumar/" }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/cisco-logo.png', type: 'image/png' },
    ],
    shortcut: '/cisco-logo.png',
    apple: '/cisco-logo.png',
  },
  openGraph: {
    title: "Cisco Zero-Trust Hybrid Data Center Simulation | Cyber Track 2026",
    description: "Interactive simulation portal modeling default-deny micro-segmentation, ASA VPN tunnels, and Kubernetes container isolation.",
    url: "https://cisco-cyber-track-project.vercel.app",
    siteName: "Cisco Zero-Trust Portal",
    images: [
      {
        url: "/cisco-logo.png",
        width: 800,
        height: 800,
        alt: "Cisco Zero-Trust Cyber Security Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cisco Zero-Trust Hybrid Data Center Simulation",
    description: "Real-time threat simulator, IaC explorer, and Packet Tracer topology visualization.",
    images: ["/cisco-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${firaCode.variable}`}>
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
