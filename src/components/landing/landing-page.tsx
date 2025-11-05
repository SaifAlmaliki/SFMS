"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Brain,
  Shield,
  Zap,
  Eye,
  FileCheck,
  Network,
  BarChart3,
  Bug,
  CheckCircle2,
  Globe,
  Lock,
  Activity,
  MessageSquare,
  Workflow,
  AlertTriangle,
  Database,
  Settings,
  Users,
  TrendingUp,
  FileText,
  Bot,
  Server,
  Target,
  Scan,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Compliance Management",
    description: "Track compliance with PCI DSS, HIPAA, GDPR, ISO 27001 and other frameworks automatically.",
    color: "text-purple-500",
  },
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    description: "Monitor firewall logs, device health, and security events in real-time with streaming updates.",
    color: "text-red-500",
  },
  {
    icon: Network,
    title: "Multi-Vendor Support",
    description: "Unified management for FortiGate, Palo Alto, Cisco, and other firewall vendors.",
    color: "text-indigo-500",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    description: "Orchestrate complex policy deployments, approvals, and rollbacks with automated workflows.",
    color: "text-pink-500",
  },
  {
    icon: Target,
    title: "Threat Intelligence",
    description: "Access CVEs, MITRE ATT&CK framework, IoCs, and threat intelligence feeds.",
    color: "text-cyan-500",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    description: "Fine-grained permissions with Viewer, Editor, and Admin roles for secure access.",
    color: "text-emerald-500",
  },
  {
    icon: FileText,
    title: "Comprehensive Audit Trails",
    description: "Immutable audit logs for all policy changes, deployments, and administrative actions.",
    color: "text-slate-500",
  },
  {
    icon: Database,
    title: "Configuration Snapshots",
    description: "Version control and rollback capabilities for firewall configurations with scheduled snapshots.",
    color: "text-blue-500",
  },
  {
    icon: Eye,
    title: "Policy Lifecycle Management",
    description: "Complete lifecycle management from creation through approval, deployment, and retirement.",
    color: "text-green-500",
  },
];

const aiCapabilities = [
  {
    title: "AI Policy Generation",
    description: "Convert natural language commands into structured firewall rules with intelligent duplicate detection.",
    icon: Bot,
  },
  {
    title: "Policy Validation",
    description: "AI-powered validation against security best practices and conflict detection.",
    icon: CheckCircle2,
  },
  {
    title: "Policy Simulation",
    description: "Dry-run traffic flow testing to verify policy behavior before deployment.",
    icon: Scan,
  },
  {
    title: "Self-Healing Security",
    description: "Automatically detect and correct misconfigurations and policy drift.",
    icon: Zap,
  },
  {
    title: "Anomaly Detection (UBA)",
    description: "User Behavior Analytics to detect anomalous admin actions and potential threats.",
    icon: AlertTriangle,
  },
  {
    title: "NLP Chatbot Assistant",
    description: "Conversational AI assistant for queries, policy guidance, and guided operations.",
    icon: MessageSquare,
  },
  {
    title: "Model Management",
    description: "Retrain, evaluate, and version AI models for continuous improvement.",
    icon: Settings,
  },
];

const integrations = [
  { name: "FortiGate", icon: Server },
  { name: "ServiceNow", icon: Workflow },
  { name: "Jira", icon: Bug },
  { name: "SIEM/SOAR", icon: Shield },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <AuroraBackground className="min-h-[90vh]">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-6 items-center justify-center px-4 text-center"
        >
          <div className="text-4xl md:text-7xl font-bold dark:text-white">
            AI-Powered Firewall Automation Platform
          </div>
          <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4 max-w-3xl">
            Secure your network with intelligent automation, real-time monitoring, and AI-driven policy management
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/dashboard">
              <Button className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-8 py-6 text-lg hover:scale-105 transition-transform">
                Get Started
              </Button>
            </Link>
            <Link href="/policies">
              <Button variant="outline" className="rounded-full px-8 py-6 text-lg hover:scale-105 transition-transform">
                Explore Features
              </Button>
            </Link>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* Features Grid Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Comprehensive Firewall Management</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage, monitor, and secure your firewall infrastructure
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 px-4 bg-zinc-100 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-10 w-10 text-blue-500" />
              <h2 className="text-3xl md:text-5xl font-bold">AI-Powered Capabilities</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leverage advanced AI to automate policy generation, validation, and security operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiCapabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-blue-500/50">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <capability.icon className="h-8 w-8 text-blue-500" />
                      <CardTitle>{capability.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {capability.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Our Platform?</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <CardTitle className="mb-2">Reduced Complexity</CardTitle>
            <CardDescription>
              Natural language commands replace complex CLI configurations
            </CardDescription>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Lock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <CardTitle className="mb-2">Enhanced Security</CardTitle>
            <CardDescription>
              Automated validation and self-healing maintain security posture
            </CardDescription>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle className="mb-2">Faster Deployment</CardTitle>
            <CardDescription>
              Automated workflows accelerate policy deployment and changes
            </CardDescription>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <CardTitle className="mb-2">Better Visibility</CardTitle>
            <CardDescription>
              Real-time monitoring and comprehensive audit trails
            </CardDescription>
          </Card>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-4 bg-zinc-100 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Globe className="h-10 w-10 mx-auto mb-4 text-blue-500" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Seamless Integrations</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with your existing tools and workflows
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="text-center p-6 hover:shadow-lg transition-all hover:scale-105">
                  <integration.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle>{integration.name}</CardTitle>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Firewall Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start automating your firewall policies today with AI-powered intelligence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/ai-tools">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full">
                  Try AI Tools
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
